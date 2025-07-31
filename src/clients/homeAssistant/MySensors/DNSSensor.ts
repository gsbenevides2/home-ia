import { Logger } from '../../../logger/index.ts'
import { makeDNSTest } from '../../MakeDNSTest.ts'
import {
  DNSChecksDatabase,
  type DNSChecksDatabaseRow
} from '../../database/DNSChecks.ts'
import {
  BinarySensor,
  BinarySensorDeviceClass
} from '../AbstractEntities/BinarySensor.ts'

export class DNSSensor {
  private static instance: DNSSensor = new DNSSensor()
  private constructor() {}
  static getInstance() {
    return this.instance
  }

  private async getDbDNSServers() {
    Logger.info('DNSSensor', 'Getting DNS servers')
    return DNSChecksDatabase.getInstance().getChecks()
  }

  private async sendSensor(sensorData: DNSChecksDatabaseRow) {
    try {
      Logger.info('DNSSensor', 'Sending sensor', { sensorData })
      const testResult = await makeDNSTest(
        sensorData.domain,
        sensorData.expected_cname,
        sensorData.nsdomain
      )
      const sensor = new BinarySensor(
        `binary_sensor.${sensorData.sensor_id}`,
        `binary_sensor.${sensorData.sensor_id}`,
        {
          friendly_name: sensorData.sensor_name,
          device_class: BinarySensorDeviceClass.PROBLEM
        }
      )
      await sensor.sendData(testResult === false ? 'on' : 'off')
    } catch (error) {
      Logger.error(
        'DNSSensor',
        `Failed to send sensor data for ${sensorData.sensor_id}:`,
        error
      )
      throw error
    }
  }

  public async sendAllSensors() {
    try {
      Logger.info('DNSSensor', 'Sending all sensors')
      const dnsServers = await this.getDbDNSServers()
      await Promise.all(dnsServers.map(this.sendSensor))
    } catch (error) {
      Logger.error('DNSSensor', 'Failed to send all sensors:', error)
      throw error
    }
  }
}
