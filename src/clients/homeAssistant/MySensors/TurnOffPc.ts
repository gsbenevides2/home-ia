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
    const mqttClient = MQTTHomeAssistantClient.getInstance()
    mqttClient.createButton('turn_off_pc', 'Turn Off PC', '1.0.0', () => {
      TurnOffPc.getInstance().turnOffPc()
    })
  }
}
