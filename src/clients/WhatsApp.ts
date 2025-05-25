import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js'
import { Logger } from '../logger'


await Bun.$`rm .wwebjs_auth/session/SingletonCookie .wwebjs_auth/session/SingletonLock .wwebjs_auth/session/SingletonSocket`.nothrow()
await Bun.$`killall -9 chrome`.nothrow()

export class WhatsAppClient {
  private static instance: WhatsAppClient

  public static getInstance() {
    if (!WhatsAppClient.instance) {
      WhatsAppClient.instance = new WhatsAppClient()
    }
    return WhatsAppClient.instance
  }
  private webClient: Client
  private qrCode: string = ''
  private isReady: boolean = false

  constructor() {
    this.webClient = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: Bun.env.HEADLESS === 'true',

        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        executablePath: Bun.env.CHROME_PATH
      }
    })

    this.webClient.on('qr', qr => {
      this.qrCode = qr
    })

    this.webClient.on('ready', () => {
      this.isReady = true
    })
  }

  async connect() {
    Logger.info('WhatsAppClient', 'Initializing WhatsApp...')
    await this.webClient.initialize()
    Logger.info('WhatsAppClient', 'WhatsApp Initialized')
    Logger.info('WhatsAppClient', 'Waiting for WhatsApp to be ready...')
    await this.waitForReady()
    Logger.info('WhatsAppClient', 'WhatsApp is ready')
  }

  async sendMessage(to: number, message: string) {
    await this.waitForReady()
    const phoneNumber = `${to}@c.us`
    await this.webClient.sendMessage(phoneNumber, message)
  }

  async sendAudio(to: number, audio: string) {
    await this.waitForReady()
    const phoneNumber = `${to}@c.us`
    const media = new MessageMedia('audio/mp3', audio, 'audio.mp3')
    await this.webClient.sendMessage(phoneNumber, media)
  }

  private async waitForReady() {
    while (!this.isReady) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  async waitForQRCode() {
    while (!this.qrCode) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    return this.qrCode
  }
}
