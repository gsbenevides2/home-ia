import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

const SEGMENT_DURATION = 1 // Duração de cada segmento em segundos (balanceado para qualidade e latência)
const PLAYLIST_NAME = 'playlist.m3u8'
const SEGMENT_PREFIX = 'segment'
const SEGMENTS_TO_KEEP = 6 // Número de segmentos para manter no servidor
const RESTART_DELAY = 10000 // 10 segundos entre tentativas de reinício
const MAX_RESTART_ATTEMPTS = 5 // Máximo de tentativas de reinício consecutivas
const HLS_DIR = path.join(process.cwd(), 'camerastreams')

// Classe para gerenciar o streaming HLS
export class HLSManager {
  private ffmpegProcess: ffmpeg.FfmpegCommand | null = null
  private running = false
  private segmentCount = 0
  private isCleaningUp = false
  private cleanupInterval: NodeJS.Timeout | null = null
  private lastRestartTime = 0
  private restartAttempts = 0
  private forceRefreshInProgress = false
  private cameraName: string
  readonly hlsDir: string
  private rtspUrl: string

  constructor(cameraName: string, rtspUrl?: string) {
    this.cameraName = cameraName
    this.hlsDir = path.join(HLS_DIR, this.cameraName)
    this.rtspUrl = rtspUrl ?? ''

    if (!fs.existsSync(this.hlsDir)) {
      fs.mkdirSync(this.hlsDir, { recursive: true })
    }

    // Iniciar limpeza periódica de segmentos antigos
    this.cleanupInterval = setInterval(() => this.cleanupOldSegments(), 60000)
  }

  async start() {
    if (this.running) return
    if (this.forceRefreshInProgress) return

    // Verificar se estamos reiniciando muito rapidamente
    const now = Date.now()
    if (now - this.lastRestartTime < RESTART_DELAY) {
      setTimeout(() => this.start(), RESTART_DELAY)
      return
    }

    this.lastRestartTime = now
    this.running = true
    this.restartAttempts++

    if (this.restartAttempts > MAX_RESTART_ATTEMPTS) {
      setTimeout(() => {
        this.restartAttempts = 0
        this.start()
      }, 60000)
      this.running = false
      return
    }

    try {
      // Limpe todos os arquivos antigos antes de iniciar
      await this.cleanupAllSegments()

      // Iniciar FFmpeg para gerar segmentos HLS
      this.ffmpegProcess = ffmpeg(this.rtspUrl)
        .inputOptions([
          '-rtsp_transport',
          'tcp',
          '-fflags',
          '+genpts+flush_packets+discardcorrupt',
          '-flags',
          'low_delay',
          '-analyzeduration',
          '1000000', // 1 segundo - melhor análise de streaming
          '-probesize',
          '1M'
        ])
        .outputOptions([
          '-c:v',
          'libx264',
          '-preset',
          'veryfast', // balanço entre velocidade e qualidade
          '-tune',
          'zerolatency',
          '-profile:v',
          'main', // melhor qualidade que baseline
          '-crf',
          '23', // balanço entre qualidade e tamanho (23 é o default, menor = melhor qualidade)
          '-level',
          '4.0',
          '-pix_fmt',
          'yuv420p',
          '-bufsize',
          '2000k', // Buffer maior para qualidade mais estável
          '-maxrate',
          '2500k', // Taxa máxima de bits maior
          '-g',
          '30', // GOP a cada 1s com 30fps
          '-keyint_min',
          '30',
          '-r',
          '30', // 30 fps
          '-hls_time',
          SEGMENT_DURATION.toString(),
          '-hls_list_size',
          SEGMENTS_TO_KEEP.toString(),
          '-hls_flags',
          'delete_segments+append_list+discont_start+omit_endlist',
          '-hls_segment_filename',
          path.join(this.hlsDir, `${SEGMENT_PREFIX}%03d.ts`),
          '-hls_segment_type',
          'mpegts',
          '-start_number',
          '0',
          '-sc_threshold',
          '40', // permitir mudanças de cena para qualidade
          '-f',
          'hls'
        ])
        .output(path.join(this.hlsDir, PLAYLIST_NAME))
        .on('start', () => {
          this.segmentCount = 0
        })
        .on('stderr', stderrLine => {
          if (stderrLine.includes('Opening')) {
            this.segmentCount++
            // Resetar contador de tentativas quando segmentos são criados com sucesso
            if (this.segmentCount > 2) {
              this.restartAttempts = 0
            }
          }
        })
        .on('error', (err: Error) => {
          console.log('Erro no FFmpeg', err)
          const errorMessageOperationNotPermited = err.message.includes(
            'Operation not permitted'
          )

          if (errorMessageOperationNotPermited) {
            try {
              Bun.spawnSync(['pkill', 'ffmpeg'], {
                stderr: 'inherit'
              })
              console.log('Killed all ffmpeg processes')
            } catch (error) {
              console.error('Error killing ffmpeg processes:', error)
            }
          }

          this.running = false
          this.scheduleRestart()
        })
        .on('end', () => {
          this.running = false
          this.scheduleRestart()
        })

      // Inicia o processo sem esperar
      this.ffmpegProcess.run()
    } catch {
      this.running = false
      this.scheduleRestart()
    }
  }

  setRtspUrl(rtspUrl: string) {
    this.rtspUrl = rtspUrl
  }

  private scheduleRestart() {
    // Só reinicia após um erro ou término do FFmpeg
    setTimeout(() => this.start(), RESTART_DELAY)
  }

  private async cleanupAllSegments() {
    try {
      const files = await fs.promises.readdir(HLS_DIR)
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
          try {
            await fs.promises.unlink(path.join(HLS_DIR, file))
          } catch {
            // Ignora erros se o arquivo já foi removido
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        // Ignora erro se o diretório não existir
      }
    }
  }

  private async cleanupOldSegments() {
    if (this.isCleaningUp) return
    this.isCleaningUp = true

    try {
      const files = await fs.promises.readdir(this.hlsDir)
      const segmentFiles = files
        .filter(file => file.startsWith(SEGMENT_PREFIX) && file.endsWith('.ts'))
        .sort((a, b) => {
          // Extrair o número do segmento do nome do arquivo
          const numA = parseInt(
            a.replace(SEGMENT_PREFIX, '').replace('.ts', ''),
            10
          )
          const numB = parseInt(
            b.replace(SEGMENT_PREFIX, '').replace('.ts', ''),
            10
          )
          return numA - numB
        })

      // Manter apenas os últimos SEGMENTS_TO_KEEP segmentos
      if (segmentFiles.length > SEGMENTS_TO_KEEP) {
        const filesToRemove = segmentFiles.slice(
          0,
          segmentFiles.length - SEGMENTS_TO_KEEP
        )
        for (const file of filesToRemove) {
          try {
            await fs.promises.unlink(path.join(HLS_DIR, file))
          } catch {
            // Ignora erros se o arquivo já foi removido
          }
        }
      }
    } catch {
      // Ignora erros na limpeza de segmentos
    } finally {
      this.isCleaningUp = false
    }
  }

  async stop() {
    if (this.ffmpegProcess) {
      try {
        this.ffmpegProcess.kill('SIGTERM')
        await Bun.spawn(['pkill', 'ffmpeg'], {
          stderr: 'inherit'
        })
      } catch {
        // Ignora erros ao encerrar FFmpeg
      }
      this.ffmpegProcess = null
    }

    this.running = false

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    await this.cleanupAllSegments()
  }

  isRunning() {
    return this.running
  }

  async forceRefresh() {
    return
  }

  get playlistPath() {
    return path.join(this.hlsDir, PLAYLIST_NAME)
  }
}
