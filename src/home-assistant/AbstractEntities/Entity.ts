import axios, { AxiosInstance } from "npm:axios";

export abstract class Entity {
  private entity_id: string;
  private unique_id: string;
  protected attributes: EntityAttributes;
  private sensor_type: string;
  protected api: AxiosInstance;

  protected constructor(sensor_type: SensorType, entity_id: string, unique_id: string, attributes: EntityAttributes) {
    this.entity_id = entity_id;
    this.sensor_type = sensor_type;
    this.unique_id = unique_id;
    this.attributes = attributes;

    const host = Deno.env.get("HA_URL");
    if (!host) throw new Error("HA_URL not set");
    const url = new URL(host);
    url.pathname = `/api/states/${this.sensor_type}.${this.unique_id}`;

    this.api = axios.create({
      baseURL: url.toString(),
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${Deno.env.get("HA_TOKEN")}`,
      },
    });
  }

  sendState(state: unknown): Promise<void> {
    return this.api.post("", {
      entity_id: this.entity_id,
      unique_id: this.unique_id,
      state,
      attributes: this.attributes,
    });
  }
}

export enum SensorType {
  BINARY_SENSOR = "binary_sensor",
  SENSOR = "sensor",
}

export interface EntityAttributes {
  friendly_name: string;
}
