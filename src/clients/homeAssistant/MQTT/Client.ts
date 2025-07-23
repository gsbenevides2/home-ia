import mqtt from 'mqtt'
import { Logger } from '../../../logger/index.ts'

const MQTT_BROKER = Bun.env.MQTT_BROKER
const MQTT_PORT = parseInt(Bun.env.MQTT_PORT || '1883')
const DEVICE_ID = Bun.env.MQTT_DEVICE_ID
const MQTT_USERNAME = Bun.env.MQTT_USERNAME
const MQTT_PASSWORD = Bun.env.MQTT_PASSWORD

if (
  !MQTT_BROKER ||
  !MQTT_PORT ||
  !DEVICE_ID ||
  !MQTT_USERNAME ||
  !MQTT_PASSWORD
) {
  throw new Error(
    'MQTT_BROKER, MQTT_PORT, MQTT_DEVICE_ID, MQTT_USERNAME, MQTT_PASSWORD are required'
  )
}

export class MQTTHomeAssistantClient {
  private static instance: MQTTHomeAssistantClient =
    new MQTTHomeAssistantClient(
      MQTT_BROKER as string,
      MQTT_USERNAME as string,
      MQTT_PASSWORD as string,
      DEVICE_ID as string,
      MQTT_PORT as number
    )
  static getInstance() {
    return this.instance
  }
  private commandTopicAndCallback: {
    commandTopic: string
    callback: (message: string) => void
  }[] = []

  private availabilitiesTopics: string[] = []
  private client: mqtt.MqttClient
  private deviceId: string
  private connected: boolean = false

  constructor(
    brokerUrl: string,
    username: string,
    password: string,
    deviceId: string,
    port: number = 1883
  ) {
    this.deviceId = deviceId

    this.client = mqtt.connect(brokerUrl, {
      clientId: `${deviceId}_${Date.now()}`,
      username,
      password,
      port,
      clean: true,
      reconnectPeriod: 5000
    })

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      Logger.info('MQTT', 'Connected to MQTT broker')
      this.connected = true
    })

    this.client.on('error', (error: Error) => {
      Logger.error('MQTT', 'MQTT connection error:', error)
    })

    this.client.on('close', () => {
      Logger.error('MQTT', 'MQTT connection closed')
    })

    this.client.on('offline', () => {
      Logger.error('MQTT', 'MQTT offline')
    })

    this.client.on('reconnect', () => {
      Logger.info('MQTT', 'Reconnecting MQTT...')
    })

    this.client.on('message', (topic: string, message: Buffer) => {
      const commandTopicAndCallback = this.commandTopicAndCallback.find(
        commandTopicAndCallback =>
          commandTopicAndCallback.commandTopic === topic
      )
      if (commandTopicAndCallback) {
        commandTopicAndCallback.callback(message.toString())
      }
    })
  }

  public async waitConnection() {
    await new Promise(resolve =>
      setTimeout(() => {
        if (this.connected) {
          resolve(true)
        } else {
          this.waitConnection()
        }
      }, 1000)
    )
  }

  public async createButton(
    buttonId: string,
    name: string,
    sw_version: string,
    onCommand: (message: string) => void
  ) {
    await this.waitConnection()
    const commandTopic = `homeassistant/button/${this.deviceId}/${buttonId}/command`
    const configTopic = `homeassistant/button/${this.deviceId}/${buttonId}/config`
    const availabilityTopic = `homeassistant/button/${this.deviceId}/availability`
    const deviceConfig = {
      name: name,
      command_topic: commandTopic,
      availability_topic: availabilityTopic,
      payload_available: 'online',
      payload_not_available: 'offline',
      unique_id: `${this.deviceId}_${buttonId}`,
      device: {
        name: name,
        model: 'Botão Virtual',
        manufacturer: 'Home IA',
        sw_version: sw_version,
        identifiers: [this.deviceId]
      }
    }

    this.commandTopicAndCallback.push({
      commandTopic: commandTopic,
      callback: onCommand
    })

    this.client.publish(configTopic, JSON.stringify(deviceConfig), {
      retain: true,
      qos: 1
    })
    this.client.publish(availabilityTopic, 'online', { retain: true })
    Logger.info('MQTT', 'Subscribing to command topic:', commandTopic)
    this.client.subscribe(commandTopic)
  }

  disconnect(): void {
    Logger.info('MQTT', 'Disconnecting MQTT client...')
    this.availabilitiesTopics.forEach(availabilityTopic => {
      this.client.publish(
        availabilityTopic,
        'offline',
        { retain: true },
        () => {
          this.client.end()
        }
      )
    })
    this.connected = false
    this.client.end()
  }
}
