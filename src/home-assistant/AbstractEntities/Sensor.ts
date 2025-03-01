import { Entity, EntityAttributes, SensorType } from "./Entity.ts";

export class Sensor<GenericState, GenericAttributtes extends SensorAttributes> extends Entity {
  protected declare attributes: GenericAttributtes;

  constructor(entity_id: string, unique_id: string, attributtes: GenericAttributtes) {
    super(SensorType.SENSOR, entity_id, unique_id, attributtes);
  }

  override sendState(state: GenericState): Promise<void> {
    return super.sendState(state);
  }

  getAttributes(): GenericAttributtes {
    return this.attributes;
  }

  setAttributes(attributtes: GenericAttributtes): void {
    this.attributes = attributtes;
  }
}

export enum SensorDeviceClass {
  ENUM = "enum",
}

export interface SensorAttributes extends EntityAttributes {
  device_class?: SensorDeviceClass;
}
