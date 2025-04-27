import {
  StatusPageDatabase,
  type StatusPageDatabaseRow
} from '../../database/StatusPages.ts'
import { fetchFromAtlassianStatuspage } from '../../status/AtlasianStatus.ts'
import { fetchFromIncidentIoStatus } from '../../status/IncidentStatus.ts'
import { fetchFromInstatusStatuspage } from '../../status/InStatusStatus.ts'
import {
  BinarySensor,
  BinarySensorDeviceClass,
  type BinarySensorAttributes
} from '../AbstractEntities/BinarySensor.ts'

const platforms = {
  incident_io: fetchFromIncidentIoStatus,
  atlassian: fetchFromAtlassianStatuspage,
  instatus: fetchFromInstatusStatuspage
}

interface StatusSensorAttributes extends BinarySensorAttributes {
  status_url: string
  problem_description?: string
}

export class StatusSensors {
  private static instance: StatusSensors = new StatusSensors()
  private constructor() {}
  static getInstance() {
    return this.instance
  }

  public async getDbStatusPages() {
    return StatusPageDatabase.getInstance().getChecks()
  }

  public async sendSensor(sensorData: StatusPageDatabaseRow) {
    const response = await platforms[
      sensorData.status_platform as keyof typeof platforms
    ](sensorData.status_url)
    const problem_description =
      response.status === 'DOWN' ? response.problemDescription : undefined
    const status = response.status === 'DOWN' ? 'on' : 'off'
    const sensor = new BinarySensor<StatusSensorAttributes>(
      `binary_sensor.${sensorData.sensor_id}`,
      `binary_sensor.${sensorData.sensor_id}`,
      {
        friendly_name: sensorData.sensor_name,
        device_class: BinarySensorDeviceClass.PROBLEM,
        status_url: sensorData.status_url,
        problem_description: problem_description
      }
    )
    await sensor.sendData(status)
  }
  public async sendAllStatus() {
    const statusPages = await this.getDbStatusPages()
    await Promise.all(statusPages.map(this.sendSensor))
  }

  public async getStatus(sensorId: string) {
    const sensor = new BinarySensor<StatusSensorAttributes>(
      `binary_sensor.${sensorId}`,
      `binary_sensor.${sensorId}`,
      {
        friendly_name: sensorId,
        device_class: BinarySensorDeviceClass.PROBLEM,
        status_url: '',
        problem_description: ''
      }
    )
    const sensorData = await sensor.getData()
    return sensorData
  }
}
