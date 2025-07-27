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
      throw new Error('TURN_OFF_PC_IP and TURN_OFF_PC_PASSWORD must be set')
    }
    await axios.get(`http://${ip}:8624?auth=${password}`)
  }

  async setupButton() {
    const mqttClient = MQTTHomeAssistantClient.getInstance()
    mqttClient.createButton('turn_off_pc', 'Turn Off PC', '1.0.0', () => {
      TurnOffPc.getInstance().turnOffPc()
    })
  }
}
