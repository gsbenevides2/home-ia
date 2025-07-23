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
    await this.sensor.sendData(state)
  }

  async getCodespacesStatus() {
    const response = await this.sensor.getData()
    return response.state
  }

  async setupButton() {
    const mqttClient = MQTTHomeAssistantClient.getInstance()
    mqttClient.createButton('codespaces', 'Toogle Codespaces', '1.0.0', () => {
      CodespacesComputeEngineMachine.getInstance().toogleMachine()
    })
  }
}
