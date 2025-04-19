import { StatusPageDatabase, type StatusPageDatabaseRow } from "../../database/StatusPages.ts";
import { fetchFromAtlassianStatuspage } from "../../status/AtlasianStatus.ts";
import { fetchFromIncidentIoStatus } from "../../status/IncidentStatus.ts";
import { fetchFromInstatusStatuspage } from "../../status/InStatusStatus.ts";
import { BinarySensor, BinarySensorDeviceClass } from "../AbstractEntities/BinarySensor.ts";

const platforms = {
  incident_io: fetchFromIncidentIoStatus,
  atlassian: fetchFromAtlassianStatuspage,
  instatus: fetchFromInstatusStatuspage,
};

export class StatusSensors {
  private static instance: StatusSensors = new StatusSensors();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  public async getDbStatusPages() {
    return StatusPageDatabase.getInstance().getChecks();
  }

  public async sendSensor(sensorData: StatusPageDatabaseRow) {
    const status = await platforms[sensorData.status_platform as keyof typeof platforms](sensorData.status_url);
    const sensor = new BinarySensor(`binary_sensor.${sensorData.sensor_id}`, `binary_sensor.${sensorData.sensor_id}`, {
      friendly_name: sensorData.sensor_name,
      device_class: BinarySensorDeviceClass.PROBLEM,
    });
    await sensor.sendData(status === "DOWN" ? "on" : "off");
  }
  public async sendAllStatus() {
    const statusPages = await this.getDbStatusPages();
    await Promise.all(statusPages.map(this.sendSensor));
  }
}
