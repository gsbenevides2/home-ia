import { Logger } from '../../../logger/index.ts'
import {
  CodespacesComputeEngineMachine,
  CodespacesInstanceStatus
} from '../../google/CodespacesComputeEngineMachine.ts'
import {
  Sensor,
  type SensorAttributes,
  SensorDeviceClass
} from '../AbstractEntities/Sensor.ts'
import { MQTTHomeAssistantClient } from '../MQTT/Client.ts'

interface CodespacesAttributes extends SensorAttributes {
  options: CodespacesInstanceStatus[]
  icon: string
}

type CodespacesState = CodespacesInstanceStatus

export class CodespacesSensor {
  private static instance: CodespacesSensor = new CodespacesSensor()
  private constructor() {}
  static getInstance() {
    return this.instance
  }

  private sensor = new Sensor<CodespacesState, CodespacesAttributes>(
    'sensor.codespaces',
    'sensor.codespaces',
    {
      device_class: SensorDeviceClass.ENUM,
      friendly_name: 'Codespaces',
      icon: 'mdi:server',
      options: Object.values(CodespacesInstanceStatus)
    }
  )

  async sendState(state: CodespacesInstanceStatus) {
    Logger.info('CodespacesSensor', 'Sending state', { state })
    await this.sensor.sendData(state)
  }

  async getCodespacesStatus() {
    Logger.info('CodespacesSensor', 'Getting codespaces status')
    const response = await this.sensor.getData()
    return response.state
  }

  async setupButton() {
    Logger.info('CodespacesSensor', 'Setting up button')
    const mqttClient = MQTTHomeAssistantClient.getInstance()
    mqttClient.createButton('codespaces', 'Toogle Codespaces', '1.0.0', () => {
      Logger.info('CodespacesSensor', 'Toogle codespaces')
      CodespacesComputeEngineMachine.getInstance().toogleMachine()
    })
  }
}
