import { Entity, EntityAttributes, SensorType } from "./Entity.ts";

export class Sensor<GenericState, GenericAttributtes extends SensorAttributes> extends Entity<GenericState, GenericAttributtes> {
  constructor(entity_id: string, unique_id: string, attributes: GenericAttributtes) {
    super(SensorType.SENSOR, entity_id, unique_id, attributes);
  }
}

export enum SensorDeviceClass {
  ENUM = "enum",
}

export interface SensorAttributes extends EntityAttributes {
  device_class?: SensorDeviceClass;
}
