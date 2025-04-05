import { fetchFromAtlassianStatuspage } from "../../clients/AtlasianStatus.ts";
import { fetchFromIncidentIoStatus } from "../../clients/IncidentStatus.ts";
import { fetchFromInstatusStatuspage } from "../../clients/InStatusStatus.ts";
import { DatabaseClient } from "../../clients/Postgres.ts";
import { BinarySensor, BinarySensorDeviceClass } from "../AbstractEntities/BinarySensor.ts";

const platforms = {
  "incident_io": fetchFromIncidentIoStatus,
  "atlassian": fetchFromAtlassianStatuspage,
  "instatus": fetchFromInstatusStatuspage,
}

interface DbRow {
  sensor_id: string;
  sensor_name: string;
  status_platform: string;
  status_url: string;
}

export class StatusSensors {
  private static instance: StatusSensors = new StatusSensors();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  public async getDbStatusPages(){
    const db = DatabaseClient.getInstance();
    const result = await db.queryObject<DbRow>({
      text: "SELECT sensor_id, sensor_name, status_platform, status_url  FROM status_pages",
      fields: ["sensor_id", "sensor_name", "status_platform", "status_url"],
    });
    return result.rows;
  }

  public async sendSensor(sensorData: DbRow){
    const status = await platforms[sensorData.status_platform as keyof typeof platforms](sensorData.status_url);
    const sensor = new BinarySensor(sensorData.sensor_id, sensorData.sensor_id, {
      friendly_name: sensorData.sensor_name,
      device_class: BinarySensorDeviceClass.PROBLEM,
    });
    await sensor.sendState(status === "DOWN");
  }
  public async sendAllStatus() {
    const statusPages = await this.getDbStatusPages();
    await Promise.all(statusPages.map(this.sendSensor));
  }
}
