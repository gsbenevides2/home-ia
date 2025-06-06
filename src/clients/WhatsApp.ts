import { ChildProcess, spawn } from 'child_process'
import { EventEmitter } from 'node:events'
import path from 'path'
import { Logger } from '../logger'
import { WhatsAppIPCClient } from './WhatsAppIPC'

export class WhatsAppClient {
  protected static instance: WhatsAppClient | null = null
  private nodeProcess: ChildProcess | null = null
  private ipcClient: WhatsAppIPCClient | null = null
  private initializationEventEmmiter = new EventEmitter()
  private isReady: boolean = false
  private qrCode: string = ''

  public static async getInstance() {
    if (WhatsAppClient.instance) {
      await WhatsAppClient.waitReleaseInstance()
    }

    if (!WhatsAppClient.instance) {
      WhatsAppClient.instance = new WhatsAppClient()
    }
    return WhatsAppClient.instance
  }

  private static async waitReleaseInstance() {
    while (WhatsAppClient.instance) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  public static forceCurrentInstanceRelease() {
    if (WhatsAppClient.instance) {
      WhatsAppClient.instance.release()
    }
  }

  private async startNodeProcess() {
    const servicePath = path.join(process.cwd(), 'src/whatsapp-service/whatsapp-node-service.mjs')
    
    Logger.info('WhatsAppClient', 'Starting WhatsApp Node.js service...')
    this.nodeProcess = spawn('node', [servicePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    })

    this.nodeProcess.stdout?.on('data', (data) => {
      Logger.info('WhatsAppNodeService', data.toString().trim())
    })

    this.nodeProcess.stderr?.on('data', (data) => {
      Logger.error('WhatsAppNodeService', data.toString().trim())
    })

    this.nodeProcess.on('exit', (code) => {
      Logger.warn('WhatsAppClient', `Node.js service exited with code ${code}`)
      this.nodeProcess = null
    })

    // Espera um pouco para o serviço inicializar
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  private async ensureIPCConnection() {
    if (!this.ipcClient) {
      // Inicia o processo Node.js se necessário
      if (!this.nodeProcess) {
        await this.startNodeProcess()
      }

      this.ipcClient = new WhatsAppIPCClient()
      
      this.ipcClient.on('qr_update', (qr) => {
        this.qrCode = qr
        Logger.info('WhatsAppClient', 'Awaiting for authentication...')
        this.initializationEventEmmiter.emit('awaitingForAuthentication')
      })

      this.ipcClient.on('ready', () => {
        this.isReady = true
        Logger.info('WhatsAppClient', 'WhatsApp is ready')
        this.initializationEventEmmiter.emit('readyToSendMessages')
      })

      this.ipcClient.on('auth_failed', () => {
        this.isReady = false
        this.qrCode = ''
        Logger.error('WhatsAppClient', 'Authentication failed')
      })

      await this.ipcClient.connect()
    }
  }

  async connect(): Promise<'readyToSendMessages' | 'awaitingForAuthentication'> {
    return new Promise(async (resolve) => {
      this.initializationEventEmmiter.on('readyToSendMessages', () => {
        resolve('readyToSendMessages')
      })
      this.initializationEventEmmiter.on('awaitingForAuthentication', () => {
        resolve('awaitingForAuthentication')
      })

      await this.ensureIPCConnection()
      const result = await this.ipcClient!.connectWhatsApp()
      
      if (result === 'readyToSendMessages') {
        this.isReady = true
      }
    })
  }

  async sendMessage(to: number, message: string) {
    await this.ensureIPCConnection()
    await this.ipcClient!.sendWhatsAppMessage(to, message)
  }

  async sendAudio(to: number, audio: string) {
    await this.ensureIPCConnection()
    await this.ipcClient!.sendWhatsAppAudio(to, audio)
  }

  async waitForQRCode() {
    while (!this.qrCode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    return this.qrCode
  }

  async release() {
    Logger.info('WhatsAppClient', 'Releasing WhatsApp...')
    
    if (this.ipcClient) {
      await this.ipcClient.release()
      this.ipcClient.disconnect()
      this.ipcClient = null
    }

    if (this.nodeProcess) {
      this.nodeProcess.kill('SIGTERM')
      this.nodeProcess = null
    }

    WhatsAppClient.instance = null
    this.isReady = false
    this.qrCode = ''
  }
}
