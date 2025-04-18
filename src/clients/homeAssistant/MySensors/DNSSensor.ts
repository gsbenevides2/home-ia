import { Logger } from "../../../logger/index.ts";
import { makeDNSTest } from "../../MakeDNSTest.ts";
import { DatabaseClient } from "../../Postgres.ts";
import { BinarySensor, BinarySensorDeviceClass } from "../AbstractEntities/BinarySensor.ts";

interface DbRow {
  sensor_id: string;
  sensor_name: string;
  expected_cname: string;
  domain: string;
  nsdomain: string;
}

export class DNSSensor {
  private static instance: DNSSensor = new DNSSensor();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  private async getDbDNSServers() {
    const db = await DatabaseClient.getConnection();
    const result = await db.queryObject<DbRow>({
      text: "SELECT sensor_id, sensor_name, expected_cname, domain, nsdomain FROM dns_checks",
      fields: ["sensor_id", "sensor_name", "expected_cname", "domain", "nsdomain"],
    });
    await db.release();
    return result.rows;
  }

  private async sendSensor(sensorData: DbRow) {
    try {
      const testResult = await makeDNSTest(sensorData.domain, sensorData.expected_cname, sensorData.nsdomain);
      const sensor = new BinarySensor(`binary_sensor.${sensorData.sensor_id}`, `binary_sensor.${sensorData.sensor_id}`, {
        friendly_name: sensorData.sensor_name,
        device_class: BinarySensorDeviceClass.PROBLEM,
      });
      await sensor.sendData(testResult === false ? "on" : "off");
    } catch (error) {
      Logger.error("DNSSensor", `Failed to send sensor data for ${sensorData.sensor_id}:`, error);
      throw error;
    }
  }

  public async sendAllSensors() {
    try {
      const dnsServers = await this.getDbDNSServers();
      await Promise.all(dnsServers.map(this.sendSensor));
    } catch (error) {
      Logger.error("DNSSensor", "Failed to send all sensors:", error);
      throw error;
    }
  }
}
