import { randomUUID } from 'crypto'
import fs from 'fs'
import net from 'net'
import { EventEmitter } from 'node:events'
import path from 'path'
import { Logger } from '../logger'

interface IPCMessage {
  id: string
  type: string
  data?: any
}

interface IPCResponse {
  id: string
  type: string
  data?: any
  error?: string
}

export class WhatsAppIPCClient extends EventEmitter {
  private socket: net.Socket | null = null
  private connected: boolean = false
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>()
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageBuffer = ''

  constructor() {
    super()
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      this.socket = new net.Socket()
      
      this.socket.on('connect', () => {
        Logger.info('WhatsAppIPC', 'Connected to WhatsApp Node Service')
        this.connected = true
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
        resolve()
      })

      this.socket.on('data', (data) => {
        this.messageBuffer += data.toString()
        
        // Processa mensagens completas (separadas por \n)
        const lines = this.messageBuffer.split('\n')
        this.messageBuffer = lines.pop() || '' // Mantém a linha incompleta no buffer
        
        lines.forEach(line => {
          if (line.trim()) {
            try {
              const response: IPCResponse = JSON.parse(line)
              this.handleResponse(response)
            } catch (error) {
              Logger.error('WhatsAppIPC', 'Error parsing response', { error, line })
            }
          }
        })
      })

      this.socket.on('close', () => {
        Logger.warn('WhatsAppIPC', 'Connection closed')
        this.connected = false
        this.scheduleReconnect()
      })

      this.socket.on('error', (error) => {
        Logger.error('WhatsAppIPC', 'Socket error', { error })
        this.connected = false
        reject(error)
        this.scheduleReconnect()
      })

      this.socket.connect(8765, 'localhost')
    })
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        Logger.info('WhatsAppIPC', 'Attempting to reconnect...')
        await this.connect()
      } catch (error) {
        Logger.error('WhatsAppIPC', 'Reconnection failed', { error })
        this.scheduleReconnect()
      }
    }, 5000)
  }

  private handleResponse(response: IPCResponse) {
    const { id, type, data, error } = response

    if (id && this.pendingRequests.has(id)) {
      const { resolve, reject } = this.pendingRequests.get(id)!
      this.pendingRequests.delete(id)
      
      if (error) {
        reject(new Error(error))
      } else {
        resolve(data)
      }
      return
    }

    // Trata broadcasts (mensagens sem ID)
    switch (type) {
      case 'qr_update':
        this.emit('qr_update', data)
        break
      case 'ready':
        this.emit('ready')
        break
      case 'auth_failed':
        this.emit('auth_failed')
        break
    }
  }

  private async sendMessage(type: string, data?: any): Promise<any> {
    if (!this.connected) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(7)
      const message: IPCMessage = { id, type, data }
      
      this.pendingRequests.set(id, { resolve, reject })
      
      // Timeout para requests
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000)

      if (this.socket) {
        this.socket.write(JSON.stringify(message))
      } else {
        reject(new Error('Socket not available'))
      }
    })
  }

  async connectWhatsApp(): Promise<'readyToSendMessages' | 'awaitingForAuthentication'> {
    return await this.sendMessage('connect')
  }

  async sendWhatsAppMessage(to: number, message: string): Promise<void> {
    await this.sendMessage('sendMessage', { to, message })
  }

  async sendWhatsAppAudio(to: number, audioBase64: string): Promise<void> {
    // Criar arquivo temporário
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const tempFileName = `audio_${randomUUID()}.mp3`
    const tempFilePath = path.join(tempDir, tempFileName)
    
    try {
      // Salvar áudio base64 em arquivo temporário
      const audioBuffer = Buffer.from(audioBase64, 'base64')
      fs.writeFileSync(tempFilePath, audioBuffer)
      
      // Enviar apenas o caminho do arquivo via IPC
      await this.sendMessage('sendAudio', { to, audioFilePath: tempFilePath })
    } catch (error) {
      // Limpar arquivo em caso de erro
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      throw error
    }
  }

  async getQRCode(): Promise<string> {
    return await this.sendMessage('getQRCode')
  }

  async release(): Promise<void> {
    await this.sendMessage('release')
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }
    this.connected = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
} 