/* eslint-disable */
import baileys from 'baileys'
import { EventEmitter } from 'events'
import fs from 'fs'
import net from 'net'

const { default: makeWASocket, useMultiFileAuthState } = baileys

// Debug: verificar se makeWASocket foi importado corretamente
console.log('makeWASocket type:', typeof makeWASocket)
console.log('useMultiFileAuthState type:', typeof useMultiFileAuthState)

class WhatsAppNodeService extends EventEmitter {
  constructor() {
    super()
    this.webClient = null
    this.qrCode = ''
    this.isReady = false
    this.server = null
    this.clients = new Set()
  }

  async start() {
    // Cria servidor TCP para comunicação IPC
    this.server = net.createServer(socket => {
      console.log('Client connected')
      this.clients.add(socket)

      socket.on('data', async data => {
        try {
          const message = JSON.parse(data.toString())
          await this.handleMessage(socket, message)
        } catch (error) {
          console.error('Error parsing message:', error)
          this.sendResponse(socket, {
            id: null,
            error: 'Invalid JSON',
            type: 'error'
          })
        }
      })

      socket.on('close', () => {
        console.log('Client disconnected')
        this.clients.delete(socket)
      })

      socket.on('error', error => {
        console.error('Socket error:', error)
        this.clients.delete(socket)
      })
    })

    this.server.listen(8765, 'localhost', () => {
      console.log('WhatsApp Node Service listening on port 8765')
    })
  }

  async handleMessage(socket, message) {
    const { id, type, data } = message

    try {
      switch (type) {
        case 'connect':
          const result = await this.connect()
          this.sendResponse(socket, {
            id,
            type: 'connect_result',
            data: result
          })
          break

        case 'sendMessage':
          await this.sendMessage(data.to, data.message)
          this.sendResponse(socket, {
            id,
            type: 'message_sent',
            data: 'success'
          })
          break

        case 'sendAudio':
          await this.sendAudio(data.to, data.audioFilePath)
          this.sendResponse(socket, { id, type: 'audio_sent', data: 'success' })
          break

        case 'getQRCode':
          this.sendResponse(socket, { id, type: 'qr_code', data: this.qrCode })
          break

        case 'release':
          await this.release()
          this.sendResponse(socket, { id, type: 'released', data: 'success' })
          break

        default:
          this.sendResponse(socket, {
            id,
            type: 'error',
            data: `Unknown message type: ${type}`
          })
      }
    } catch (error) {
      console.error('Error handling message:', error)
      this.sendResponse(socket, { id, type: 'error', data: error.message })
    }
  }

  sendResponse(socket, response) {
    socket.write(JSON.stringify(response) + '\n')
  }

  broadcast(message) {
    const data = JSON.stringify(message) + '\n'
    this.clients.forEach(client => {
      try {
        client.write(data)
      } catch (error) {
        console.error('Error broadcasting to client:', error)
        this.clients.delete(client)
      }
    })
  }

  async connect() {
    return new Promise(async resolve => {
      if (this.isReady) {
        resolve('readyToSendMessages')
        return
      }

      const onReady = () => {
        this.removeListener('awaitingForAuthentication', onAuth)
        resolve('readyToSendMessages')
      }

      const onAuth = () => {
        this.removeListener('readyToSendMessages', onReady)
        resolve('awaitingForAuthentication')
      }

      this.once('readyToSendMessages', onReady)
      this.once('awaitingForAuthentication', onAuth)

      if (!this.webClient) {
        await this.initializeConnection()
      }
    })
  }

  async initializeConnection() {
    try {
      console.log('Initializing WhatsApp Loading Credentials...')
      const { state, saveCreds } = await useMultiFileAuthState(
        'data/auth_info_baileys'
      )
      console.log(
        'WhatsApp Credentials Loaded, Initializing WhatsApp Socket...'
      )

      const webClient = makeWASocket({
        auth: state,
        shouldSyncHistoryMessage: () => false,
        retryRequestDelayMs: 1000,
        maxMsgRetryCount: 3
      })

      webClient.ev.on('creds.update', saveCreds)

      webClient.ev.on('connection.update', update => {
        const { qr, connection, lastDisconnect } = update

        if (qr) {
          this.qrCode = qr
          console.log('Awaiting for authentication...')
          this.emit('awaitingForAuthentication')
          this.broadcast({ type: 'qr_update', data: qr })
        }

        if (connection === 'open') {
          console.log('WhatsApp is ready')
          this.isReady = true
          this.emit('readyToSendMessages')
          this.broadcast({ type: 'ready' })
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode
          console.log(`Connection closed with status: ${statusCode}`)
          this.isReady = false

          if (statusCode !== 401) {
            console.log('Attempting to reconnect...')
            setTimeout(() => this.initializeConnection(), 5000)
          } else {
            console.log('Authentication failed - need to re-authenticate')
            this.qrCode = ''
            this.broadcast({ type: 'auth_failed' })
          }
        }
      })

      this.webClient = webClient
    } catch (error) {
      console.error('Failed to initialize connection:', error)
      setTimeout(() => this.initializeConnection(), 10000)
    }
  }

  async sendMessage(to, message) {
    if (!this.webClient || !this.isReady) {
      throw new Error('WhatsApp is not ready')
    }
    const phoneNumber = `${to}@s.whatsapp.net`
    await this.webClient.sendMessage(phoneNumber, { text: message })
  }

  async sendAudio(to, audioFilePath) {
    if (!this.webClient || !this.isReady) {
      throw new Error('WhatsApp is not ready')
    }
    const phoneNumber = `${to}@s.whatsapp.net`

    try {
      // Ler arquivo de áudio
      const audioBuffer = fs.readFileSync(audioFilePath)

      await this.webClient.sendMessage(phoneNumber, {
        audio: audioBuffer,
        mimetype: 'audio/mp4',
        ptt: true // Enviar como voice note
      })

      // Remover arquivo temporário após envio
      fs.unlinkSync(audioFilePath)
      console.log(`Audio sent and temp file deleted: ${audioFilePath}`)
    } catch (error) {
      // Tentar remover arquivo mesmo em caso de erro
      try {
        if (fs.existsSync(audioFilePath)) {
          fs.unlinkSync(audioFilePath)
          console.log(`Temp file deleted after error: ${audioFilePath}`)
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError)
      }
      throw error
    }
  }

  async release() {
    if (this.webClient) {
      console.log('Releasing WhatsApp...')
      this.webClient.end(new Error('WhatsAppClient is being released'))
      this.webClient = null
      this.isReady = false
      this.qrCode = ''
    }
  }

  async stop() {
    await this.release()
    if (this.server) {
      this.server.close()
    }
  }
}

// Inicia o serviço
const service = new WhatsAppNodeService()
service.start()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down WhatsApp Node Service...')
  await service.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down WhatsApp Node Service...')
  await service.stop()
  process.exit(0)
})
