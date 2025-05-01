import * as net from 'net'
import Transport, { type TransportStreamOptions } from 'winston-transport'

interface LogIOTransportOptions extends TransportStreamOptions {
  host: string
  port: number
  source: string
  stream: string
}

interface WinstonLog {
  timestamp: Date
  level: string
  message: string
  program: string
  data: unknown
  tracerId?: string
}

export class LogIOTransport extends Transport {
  private readonly host: string
  private readonly port: number
  private readonly source: string
  private readonly stream: string
  private client: net.Socket | null = null
  private connected = false
  private reconnectTimeout: NodeJS.Timeout | null = null
  private readonly reconnectInterval = 5000 // 5 seconds

  constructor(options: LogIOTransportOptions) {
    super(options)
    this.host = options.host
    this.port = options.port
    this.source = options.source
    this.stream = options.stream

    this.connect()
  }

  private connect() {
    if (this.client) {
      this.client.removeAllListeners()
      this.client.destroy()
    }

    this.client = new net.Socket()

    this.client.on('connect', () => {
      this.connected = true
      this.registerInput()
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }
    })

    this.client.on('error', () => {
      this.connected = false
      this.scheduleReconnect()
    })

    this.client.on('close', () => {
      this.connected = false
      this.scheduleReconnect()
    })

    this.client.connect(this.port, this.host)
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null
        this.connect()
      }, this.reconnectInterval)
    }
  }

  private registerInput() {
    if (this.client && this.connected) {
      // Register input with log.io server
      const registerCmd = `+input|${this.stream}|${this.source}\0`
      this.client.write(registerCmd)
    }
  }

  public override log(info: WinstonLog, next: () => void) {
    if (this.client && this.connected) {
      // Format: +msg|streamName|sourceName|message\0
      let message = `[${info.timestamp} - ${info.level} ${info.tracerId ? ` - ${info.tracerId}` : ''}] - ${info.message}`
      if (info.data) {
        message += `\n${JSON.stringify(info.data, null, 2)}`
      }
      const formattedMessage = `+msg|${this.stream}|${this.source}|${message}\0`

      try {
        this.client.write(formattedMessage)
      } catch (error) {
        console.error('Error sending log to Log.io server:', error)
        this.connected = false
        this.scheduleReconnect()
      }
    }

    next()
  }

  public override close() {
    if (this.client) {
      try {
        // Unregister input before closing
        const unregisterCmd = `-input|${this.stream}|${this.source}\0`
        this.client.write(unregisterCmd)

        this.client.destroy()
        this.client = null
      } catch (error) {
        console.error('Error closing Log.io transport:', error)
      }
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }
}
