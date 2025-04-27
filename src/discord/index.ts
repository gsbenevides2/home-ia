import { Client, GatewayIntentBits, Message, Partials } from 'discord.js'
import { Logger } from '../logger/index.ts'
import { Tracer } from '../logger/Tracer.ts'
import { DiscordChatbot } from '../mcp/Chatbot.ts'
import { splitDiscordMessage } from './messageSplitter.ts'
export class DiscordBot {
  private client: Client
  private static instance: DiscordBot

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
        GatewayIntentBits.DirectMessages
      ],
      partials: [Partials.Channel, Partials.Message]
    })

    this.client.on('ready', () => {
      Logger.info('Discord Bot', 'Bot is connected to Discord', null)
    })

    this.client.on('messageCreate', async message => {
      const chatbot = await DiscordChatbot.getInstance()
      const tracer = new Tracer()
      tracer.setProgram('Discord Bot')
      const authorId = message.author.id
      const content = message.content
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

      async function getMessageSender(initialMessage: string) {
        const responseMessage = message.author.send(initialMessage)
        let pendingEdit: NodeJS.Timeout | null = null
        const messagesParts: Promise<Message>[] = [responseMessage]

        async function sendPartialMessage(messageContent: string) {
          if (messageContent.length === 0) return
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

        async function sendFinalMessage(messageContent: string) {
          await sendPartialMessage(messageContent)
          if (pendingEdit) clearTimeout(pendingEdit)
        }

        function cleanup() {
          if (pendingEdit) clearTimeout(pendingEdit)
        }

        return {
          sendPartialMessage,
          sendFinalMessage,
          cleanup
        }
      }

      chatbot
        .processQueryWithStream(content, getMessageSender, tracer)
        .catch(error => {
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
    await this.client.destroy()
  }
}
