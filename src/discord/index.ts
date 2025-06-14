import {
  AudioReceiveStream,
  createAudioPlayer,
  createAudioResource,
  EndBehaviorType,
  joinVoiceChannel,
  VoiceConnection
} from '@discordjs/voice'
import { spawn } from 'child_process'
import type { VoiceBasedChannel } from 'discord.js'
import { Client, GatewayIntentBits, Message, Partials } from 'discord.js'
import * as fs from 'fs'
import * as path from 'path'
import { GoogleSpeachToText } from '../clients/google/GoogleSpeachToText.ts'
import { GoogleTextToSpeach } from '../clients/google/GoogleTextToSpeach.ts'
import { Logger } from '../logger/index.ts'
import { Tracer } from '../logger/Tracer.ts'
import { DiscordChatbot } from '../mcp/Chatbot.ts'
import { downloadAudioInBase64 } from './downloadContent.ts'
import { splitDiscordMessage } from './messageSplitter.ts'

// Importar decodificador Opus
let OpusScript: any = null
try {
  OpusScript = require('opusscript')
  console.log('✅ opusscript carregado com sucesso')
} catch (error) {
  console.log('⚠️ opusscript não disponível, usando fallback')
}

export class DiscordBot {
  private client: Client
  private static instance: DiscordBot
  private voiceConnection: VoiceConnection | null = null
  private speechToText = GoogleSpeachToText.getInstance()
  private textToSpeech = GoogleTextToSpeach.getInstance()

  public static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot()
    }
    return DiscordBot.instance
  }

  private constructor() {
    const DISCORD_ALLOWED_USER_ID = Bun.env.DISCORD_ALLOWED_USER_ID
    const DISCORD_BOT_ID = Bun.env.DISCORD_BOT_ID
    if (!DISCORD_ALLOWED_USER_ID) {
      throw new Error('DISCORD_ALLOWED_USER_ID is not set')
    }
    if (!DISCORD_BOT_ID) {
      throw new Error('DISCORD_BOT_ID is not set')
    }
    this.client = new Client({
      intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
      ],
      partials: [Partials.Channel, Partials.Message]
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    const DISCORD_ALLOWED_USER_ID = Bun.env.DISCORD_ALLOWED_USER_ID!
    const DISCORD_BOT_ID = Bun.env.DISCORD_BOT_ID!

    this.client.on('ready', () => {
      Logger.info('Discord Bot', 'Bot is connected to Discord', null)
      this.setupVoiceConnection()
    })

    this.client.on('messageCreate', async message => {
      const chatbot = await DiscordChatbot.getInstance()
      const tracer = new Tracer()
      tracer.setProgram('Discord Bot')
      const authorId = message.author.id
      let content = message.content
      const imagesUrls: string[] = message.attachments
        .filter(attachment => attachment.contentType?.startsWith('image/'))
        .map(attachment => attachment.url)

      if (authorId === DISCORD_BOT_ID) {
        return
      }
      if (authorId !== DISCORD_ALLOWED_USER_ID) {
        message.reply('Você não tem permissão para usar este bot.')
        return
      }
      tracer.info('Message received from user', {
        authorId,
        message
      })

      const isAudio = message.attachments.some(attachment =>
        attachment.contentType?.startsWith('audio/ogg')
      )
      const audioAttachment = message.attachments.first()
      if (isAudio && audioAttachment) {
        const { proxyURL } = audioAttachment
        const responseAudio = await downloadAudioInBase64(proxyURL)
        const transcribedText = await this.speechToText.transcribeAudio(
          responseAudio.buffer,
          responseAudio.encoding,
          responseAudio.sampleRateHertz
        )
        content = transcribedText
      }

      async function getMessageSender(
        type: 'system' | 'content',
        initialMessage: string
      ) {
        const responseMessage = message.author.send(initialMessage)
        let pendingEdit: NodeJS.Timeout | null = null
        const messagesParts: Promise<Message>[] = [responseMessage]

        async function sendPartialMessage(
          type: 'system' | 'content',
          messageContent: string
        ) {
          if (messageContent.length === 0) return
          if (type === 'system') {
            message.channel.send('Sistema: ' + messageContent)
            return
          }
          return await new Promise<void>(resolve => {
            if (pendingEdit) clearTimeout(pendingEdit)
            pendingEdit = setTimeout(async () => {
              try {
                const chunks = splitDiscordMessage(messageContent)
                for (let i = 0; i < chunks.length; i++) {
                  const chunk = chunks[i]
                  const messagePart = messagesParts[i]
                  const hasMessagePart = messagePart !== undefined
                  if (!hasMessagePart) {
                    messagesParts.push(message.author.send(chunk))
                    return
                  }
                  const messagePartResolved = await messagePart
                  if (messagePartResolved.content !== chunk) {
                    messagesParts[i] = messagePartResolved.edit(chunk)
                  }
                }

                resolve()
              } catch (err) {
                console.error('Erro ao editar mensagem parcial:', err)
              } finally {
                pendingEdit = null
              }
            }, 100)
          })
        }

        async function sendFinalMessage(
          type: 'system' | 'content',
          messageContent: string
        ) {
          await sendPartialMessage(type, messageContent)
          if (pendingEdit) clearTimeout(pendingEdit)
        }

        async function sendMessage(
          type: 'system' | 'content',
          messageContent: string
        ) {
          await message.channel.send(messageContent)
        }

        function cleanup() {
          if (pendingEdit) clearTimeout(pendingEdit)
        }

        return {
          sendPartialMessage,
          sendFinalMessage,
          sendMessage,
          cleanup
        }
      }

      chatbot
        .processQueryWithStream(
          content,
          getMessageSender,
          tracer,
          undefined,
          undefined,
          imagesUrls
        )
        .catch(error => {
          console.error(error)
          tracer.error('Error processing query', {
            error
          })
          message.reply(
            'Ocorreu um erro ao processar a consulta. Por favor, tente novamente mais tarde. Seu ID de Rastreio é:\n```' +
              tracer.getID() +
              '```'
          )
        })
    })
  }

  private async setupVoiceConnection() {
    const VOICE_CHANNEL_ID = Bun.env.DISCORD_VOICE_CHANNEL_ID
    if (!VOICE_CHANNEL_ID) {
      Logger.info(
        'Discord Bot',
        'DISCORD_VOICE_CHANNEL_ID não configurado, funcionalidade de voz desabilitada',
        null
      )
      return
    }

    try {
      const channel = await this.client.channels.fetch(VOICE_CHANNEL_ID)
      if (
        !channel ||
        !('joinable' in channel) ||
        !(channel as VoiceBasedChannel).joinable
      ) {
        Logger.error(
          'Discord Bot',
          'Canal de voz inválido ou não pode ser acessado'
        )
        return
      }

      this.voiceConnection = joinVoiceChannel({
        channelId: VOICE_CHANNEL_ID,
        guildId: (channel as any).guild.id,
        adapterCreator: (channel as any).guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      })

      Logger.info('Discord Bot', 'Conectado ao canal de voz!', null)
      this.setupVoiceProcessing()

      this.voiceConnection.on('stateChange', (oldState: any, newState: any) => {
        Logger.info(
          'Discord Bot',
          `Estado da conexão de voz: ${oldState.status} → ${newState.status}`,
          null
        )
      })
    } catch (error) {
      Logger.error('Discord Bot', `Erro ao conectar ao canal de voz: ${error}`)
    }
  }
  private processingVoice = false
  private setupVoiceProcessing() {
    if (!this.voiceConnection) return

    // Configurar decodificador Opus
    let opusDecoder: any = null
    if (OpusScript) {
      try {
        opusDecoder = new OpusScript(48000, 1) // 48kHz, mono
        Logger.info('Discord Bot', 'Decodificador Opus inicializado', null)
      } catch (error) {
        Logger.error(
          'Discord Bot',
          `Erro ao inicializar decodificador Opus: ${error}`
        )
      }
    }

    // Controle de gravações ativas
    const activeRecordings = new Map<
      string,
      {
        decodedChunks: Buffer[]
        startTime: number
        decodedStream: fs.WriteStream
        isProcessing: boolean
      }
    >()

    this.voiceConnection.receiver.speaking.on('start', (userId: string) => {
      const DISCORD_ALLOWED_USER_ID = Bun.env.DISCORD_ALLOWED_USER_ID
      if (this.processingVoice) {
        Logger.info(
          'Discord Bot',
          `Usuário ${userId} começou a falar, mas já está sendo processado, ignorando...`,
          null
        )
        return
      }
      if (userId !== DISCORD_ALLOWED_USER_ID) {
        Logger.info(
          'Discord Bot',
          `Usuário ${userId} começou a falar, mas não é o usuário permitido, ignorando...`,
          null
        )
        return
      }

      this.processingVoice = true
      Logger.info('Discord Bot', `Usuário ${userId} começou a falar`, null)

      if (activeRecordings.has(userId)) {
        const recording = activeRecordings.get(userId)
        if (recording?.isProcessing) {
          Logger.info(
            'Discord Bot',
            `Usuário ${userId} ainda sendo processado, ignorando...`,
            null
          )
          return
        }
      }

      const audioStream: AudioReceiveStream =
        this.voiceConnection!.receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 2000 // 2 segundos de silêncio
          }
        })

      const timestamp = Date.now()
      const decodedPath = path.join(
        process.cwd(),
        `temp/gravacao_${userId}_${timestamp}.pcm`
      )

      // Criar diretório temp se não existir
      const tempDir = path.dirname(decodedPath)
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      const decodedStream = fs.createWriteStream(decodedPath)

      const recordingData = {
        decodedChunks: [] as Buffer[],
        startTime: Date.now(),
        decodedStream: decodedStream,
        isProcessing: false
      }

      activeRecordings.set(userId, recordingData)
      Logger.info(
        'Discord Bot',
        'Iniciando gravação com decodificação Opus',
        null
      )

      audioStream.on('data', (chunk: Buffer) => {
        const recording = activeRecordings.get(userId)
        if (!recording || recording.isProcessing) return

        // Decodificar usando Opus se disponível, caso contrário usar dados raw
        if (opusDecoder) {
          try {
            const decoded = opusDecoder.decode(chunk)
            if (decoded && decoded.length > 0) {
              recording.decodedChunks.push(decoded)
              recording.decodedStream.write(decoded)
            }
          } catch (error) {
            // Em caso de erro na decodificação, usar dados raw como fallback
            recording.decodedChunks.push(chunk)
            recording.decodedStream.write(chunk)
          }
        } else {
          // Fallback: usar dados raw do Discord (Opus encoded)
          recording.decodedChunks.push(chunk)
          recording.decodedStream.write(chunk)
        }
      })

      audioStream.on('end', async () => {
        const recording = activeRecordings.get(userId)
        if (!recording || recording.isProcessing) return

        recording.isProcessing = true
        recording.decodedStream.end()

        const decodedBuffer = Buffer.concat(recording.decodedChunks)
        const duration = Date.now() - recording.startTime

        Logger.info(
          'Discord Bot',
          `Gravação finalizada: ${decodedBuffer.length} bytes, ${duration}ms`,
          null
        )

        if (decodedBuffer.length === 0 || duration < 500) {
          Logger.info(
            'Discord Bot',
            `Gravação muito curta ou sem dados para usuário ${userId}. Buffer: ${decodedBuffer.length} bytes, Duração: ${duration}ms, OpusScript: ${!!OpusScript}`,
            null
          )
          activeRecordings.delete(userId)
          // Limpar arquivo temporário se existir
          if (fs.existsSync(decodedPath)) {
            fs.unlinkSync(decodedPath)
          }
          return
        }

        // Processar áudio decodificado com o pipeline completo
        await this.processVoiceToTextToVoice(decodedPath, userId, timestamp)
        activeRecordings.delete(userId)
      })

      audioStream.on('error', (error: any) => {
        Logger.error('Discord Bot', `Erro no stream de áudio: ${error}`)
        const recording = activeRecordings.get(userId)
        if (recording) {
          recording.decodedStream.end()
          activeRecordings.delete(userId)
        }
      })
    })
  }

  private async processVoiceToTextToVoice(
    decodedPath: string,
    userId: string,
    timestamp: number
  ) {
    const tracer = new Tracer()
    tracer.setProgram('Discord Voice Bot')

    try {
      Logger.info(
        'Discord Bot',
        `Processando pipeline completo para usuário ${userId}...`,
        null
      )

      // Etapa 1: Converter PCM para WAV
      const wavPath = await this.convertPcmToWav(decodedPath, userId, timestamp)
      if (!wavPath) {
        throw new Error('Falha na conversão PCM para WAV')
      }

      // Etapa 2: Converter voz para texto
      Logger.info('Discord Bot', 'Convertendo voz para texto...', null)
      const wavAudioBuffer = fs.readFileSync(wavPath)
      const transcription = await this.speechToText.transcribeAudio(
        wavAudioBuffer,
        'LINEAR16', // WAV com PCM LINEAR16
        48000,
        'pt-BR'
      )

      if (!transcription || transcription.trim().length === 0) {
        Logger.info(
          'Discord Bot',
          `Nenhuma transcrição obtida para usuário ${userId}`,
          null
        )
        throw new Error('Transcrição vazia')
      }

      Logger.info('Discord Bot', `Transcrição: "${transcription}"`, null)

      // Etapa 3: Processar com chatbot
      Logger.info('Discord Bot', 'Processando consulta com chatbot...', null)
      const chatbot = await DiscordChatbot.getInstance()

      let botResponse = ''
      const messageSender = {
        sendPartialMessage: (type: 'system' | 'content', content: string) => {
          Logger.info('Discord Bot', `Mensagem parcial: ${content}`, null)
          return Promise.resolve()
        },
        sendFinalMessage: (type: 'system' | 'content', content: string) => {
          Logger.info('Discord Bot', `Resposta final: ${content}`, null)
          botResponse = content
          return Promise.resolve()
        },
        sendMessage: (type: 'system' | 'content', content: string) => {
          Logger.info('Discord Bot', `Mensagem: ${content}`, null)
          botResponse += '\n' + content
          return Promise.resolve()
        },
        cleanup: () => {}
      }

      await chatbot.processQuery(
        transcription,
        messageSender,
        tracer,
        undefined,
        undefined,
        undefined,
        true
      )

      if (!botResponse || botResponse.trim().length === 0) {
        botResponse = 'Desculpe, não consegui processar sua solicitação.'
      }

      Logger.info('Discord Bot', `Resposta do chatbot: "${botResponse}"`, null)

      // Etapa 4: Converter resposta para voz
      Logger.info('Discord Bot', 'Convertendo resposta para voz...', null)
      const audioBase64 = await this.textToSpeech.textToSpeach(botResponse)

      if (!audioBase64) {
        throw new Error('Falha na conversão de texto para voz')
      }

      // Etapa 5: Salvar e reproduzir áudio
      const responseAudioPath = path.join(
        process.cwd(),
        `temp/resposta_${userId}_${timestamp}.mp3`
      )

      const responseAudioBuffer = Buffer.from(audioBase64, 'base64')
      fs.writeFileSync(responseAudioPath, responseAudioBuffer)

      Logger.info('Discord Bot', 'Tocando resposta em voz...', null)
      await this.playAudioInVoiceChannel(responseAudioPath)

      // Limpeza de arquivos temporários
      this.cleanupTempFiles([decodedPath, wavPath, responseAudioPath])

      Logger.info(
        'Discord Bot',
        `Pipeline completo finalizado para usuário ${userId}`,
        null
      )
    } catch (error) {
      Logger.error('Discord Bot', `Erro no pipeline de voz-texto-voz: ${error}`)
      tracer.error('Erro no pipeline de voz', { error, userId })
      if (
        error instanceof Error &&
        error.message.includes('Transcrição vazia')
      ) {
        return
      }
      // Em caso de erro, reproduzir áudio de erro
      try {
        const errorMessage =
          'Desculpe, ocorreu um erro ao processar sua mensagem de voz.'
        const errorAudioBase64 =
          await this.textToSpeech.textToSpeach(errorMessage)

        if (errorAudioBase64) {
          const errorAudioPath = path.join(
            process.cwd(),
            `temp/erro_${userId}_${timestamp}.mp3`
          )
          const errorAudioBuffer = Buffer.from(errorAudioBase64, 'base64')
          fs.writeFileSync(errorAudioPath, errorAudioBuffer)

          await this.playAudioInVoiceChannel(errorAudioPath)

          // Limpar arquivo de erro após uso
          setTimeout(() => {
            if (fs.existsSync(errorAudioPath)) {
              fs.unlinkSync(errorAudioPath)
            }
          }, 5000)
        }
      } catch (errorHandlingError) {
        Logger.error(
          'Discord Bot',
          `Erro ao processar mensagem de erro: ${errorHandlingError}`
        )
      }

      // Limpeza de arquivos temporários em caso de erro
      this.cleanupTempFiles([decodedPath])
    }
    this.processingVoice = false
  }

  private convertPcmToWav(
    decodedPath: string,
    userId: string,
    timestamp: number
  ): Promise<string | null> {
    return new Promise(resolve => {
      const wavPath = path.join(
        process.cwd(),
        `temp/gravacao_${userId}_${timestamp}.wav`
      )

      Logger.info('Discord Bot', 'Convertendo áudio para WAV...', null)

      // Verificar se temos decodificador Opus disponível para usar configurações adequadas
      let ffmpegArgs: string[]

      if (OpusScript) {
        // Dados foram decodificados (PCM)
        Logger.info('Discord Bot', 'Usando dados PCM decodificados', null)
        ffmpegArgs = [
          '-f',
          's16le', // Formato: signed 16-bit little endian
          '-ar',
          '48000', // Sample rate: 48kHz
          '-ac',
          '1', // Canais: mono (dados decodificados são mono)
          '-i',
          decodedPath, // Arquivo PCM decodificado
          '-acodec',
          'pcm_s16le', // Codec de saída
          '-ar',
          '48000', // Manter sample rate
          '-ac',
          '1', // Manter mono para Google Speech-to-Text
          '-y', // Sobrescrever se existir
          wavPath
        ]
      } else {
        // Dados raw do Discord (Opus frames concatenados)
        Logger.info('Discord Bot', 'Usando dados Opus raw (fallback)', null)
        ffmpegArgs = [
          '-i',
          decodedPath, // Tentar detectar formato automaticamente
          '-acodec',
          'pcm_s16le', // Codec de saída
          '-ar',
          '48000', // Sample rate padrão
          '-ac',
          '1', // Mono para Google Speech-to-Text
          '-y', // Sobrescrever se existir
          wavPath
        ]
      }

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs)

      let stderrOutput = ''
      ffmpegProcess.stderr.on('data', data => {
        stderrOutput += data.toString()
      })

      ffmpegProcess.on('close', code => {
        if (code === 0 && fs.existsSync(wavPath)) {
          const stats = fs.statSync(wavPath)
          Logger.info('Discord Bot', `WAV criado: ${stats.size} bytes`, null)
          resolve(wavPath)
        } else {
          Logger.error(
            'Discord Bot',
            `Erro FFmpeg (código ${code}): ${stderrOutput}`
          )

          // Tentar abordagem alternativa se a primeira falhar
          if (!OpusScript) {
            Logger.info(
              'Discord Bot',
              'Tentando conversão alternativa...',
              null
            )
            this.tryAlternativeConversion(decodedPath, wavPath).then(resolve)
          } else {
            resolve(null)
          }
        }
      })
    })
  }

  private tryAlternativeConversion(
    inputPath: string,
    outputPath: string
  ): Promise<string | null> {
    return new Promise(resolve => {
      // Tentar como dados raw sem especificar formato específico, usando força bruta
      const ffmpegArgs = [
        '-f',
        'data', // Formato genérico
        '-i',
        inputPath,
        '-acodec',
        'pcm_s16le',
        '-ar',
        '48000',
        '-ac',
        '1',
        '-y',
        outputPath
      ]

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs)

      let stderrOutput = ''
      ffmpegProcess.stderr.on('data', data => {
        stderrOutput += data.toString()
      })

      ffmpegProcess.on('close', code => {
        if (code === 0 && fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath)
          Logger.info(
            'Discord Bot',
            `WAV criado com conversão alternativa: ${stats.size} bytes`,
            null
          )
          resolve(outputPath)
        } else {
          Logger.error(
            'Discord Bot',
            `Conversão alternativa falhou (código ${code}): ${stderrOutput}`
          )
          resolve(null)
        }
      })
    })
  }

  private playAudioInVoiceChannel(audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.voiceConnection) {
        reject(new Error('Conexão de voz não disponível'))
        return
      }

      try {
        if (!fs.existsSync(audioPath)) {
          reject(new Error(`Arquivo de áudio não encontrado: ${audioPath}`))
          return
        }

        const player = createAudioPlayer()
        const resource = createAudioResource(audioPath)

        player.play(resource)
        this.voiceConnection.subscribe(player)

        Logger.info('Discord Bot', `Reproduzindo áudio: ${audioPath}`, null)

        player.on('stateChange', (oldState, newState) => {
          Logger.info(
            'Discord Bot',
            `Player: ${oldState.status} → ${newState.status}`,
            null
          )

          if (newState.status === 'idle') {
            resolve()
          }
        })

        player.on('error', error => {
          Logger.error('Discord Bot', `Erro no player de áudio: ${error}`)
          reject(error)
        })

        // Timeout de segurança
        setTimeout(() => {
          if (player.state.status !== 'idle') {
            player.stop()
            resolve()
          }
        }, 30000) // 30 segundos
      } catch (error) {
        Logger.error('Discord Bot', `Erro ao reproduzir áudio: ${error}`)
        reject(error)
      }
    })
  }

  private cleanupTempFiles(filePaths: string[]) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          Logger.info(
            'Discord Bot',
            `Arquivo temporário removido: ${filePath}`,
            null
          )
        }
      } catch (error) {
        Logger.error(
          'Discord Bot',
          `Erro ao remover arquivo ${filePath}: ${error}`
        )
      }
    }
  }

  async connect() {
    const DISCORD_TOKEN = Bun.env.DISCORD_TOKEN
    if (!DISCORD_TOKEN) {
      Logger.error('Discord Bot', 'DISCORD_TOKEN is not set')
      throw new Error('DISCORD_TOKEN is not set')
    }
    Logger.info('Discord Bot', 'Logging in to Discord')
    await this.client.login(DISCORD_TOKEN)
  }

  async sendMessage(message: string) {
    const DISCORD_ALLOWED_USER_ID = Bun.env.DISCORD_ALLOWED_USER_ID
    if (!DISCORD_ALLOWED_USER_ID) {
      throw new Error('DISCORD_ALLOWED_USER_ID is not set')
    }
    const user = await this.client.users.fetch(DISCORD_ALLOWED_USER_ID)
    if (!user) {
      throw new Error('DISCORD_ALLOWED_USER_ID is not set')
    }
    await user.send(message)
  }

  async disconnect() {
    if (this.voiceConnection) {
      this.voiceConnection.destroy()
      this.voiceConnection = null
    }
    await this.client.destroy()
  }
}
