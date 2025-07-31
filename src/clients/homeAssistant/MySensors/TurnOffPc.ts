import axios from 'axios'
import { Logger } from '../../../logger'
import { MQTTHomeAssistantClient } from '../MQTT/Client'
export class TurnOffPc {
  private static instance: TurnOffPc = new TurnOffPc()
  private constructor() {}
  static getInstance() {
    return this.instance
  }

  async turnOffPc() {
    Logger.info('TurnOffPc', 'Turning off PC')
    const ip = Bun.env.TURN_OFF_PC_IP
    const password = Bun.env.TURN_OFF_PC_PASSWORD
    Logger.info('TurnOffPc', `Turning off PC ${ip} with password ${password}`)
    if (!ip || !password) {
      Logger.error(
        'TurnOffPc',
        'TURN_OFF_PC_IP and TURN_OFF_PC_PASSWORD must be set'
      )
      return
    }
    const url = new URL(`http://${ip}:8624`)
    url.searchParams.set('auth', password)
    Logger.info('TurnOffPc', `URL: ${url.toString()}`)
    Logger.info('TurnOffPc', 'Sending request')
    axios
      .get(url.toString())
      .then(response => {
        Logger.info('TurnOffPc', `Response: ${response.data}`)
      })
      .catch(error => {
        Logger.error('TurnOffPc', `Error: ${error}`)
      })
  }

  async setupButton() {
    Logger.info('TurnOffPc', 'Setting up button')
    const mqttClient = MQTTHomeAssistantClient.getInstance()
    mqttClient.createButton('turn_off_pc', 'Turn Off PC', '1.0.0', () => {
      Logger.info('TurnOffPc', 'Turning off PC')
      TurnOffPc.getInstance().turnOffPc()
    })
  }
}
