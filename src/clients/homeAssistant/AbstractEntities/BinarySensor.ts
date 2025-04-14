import { Entity, EntityAttributes, SensorType } from "./Entity.ts";

export class BinarySensor<SensorAttributes extends BinarySensorAttributes> extends Entity<SensorState, SensorAttributes> {
  constructor(entity_id: string, unique_id: string, attributes: SensorAttributes) {
    super(SensorType.BINARY_SENSOR, entity_id, unique_id, attributes);
  }
}

type SensorState = "on" | "off";

export enum BinarySensorDeviceClass {
  BATTERY = "battery",
  BATTERY_CHARGING = "battery_charging",
  CARBON_MONOXIDE = "carbon_monoxide",
  COLD = "cold",
  CONNECTIVITY = "connectivity",
  DOOR = "door",
  GARAGE_DOOR = "garage_door",
  GAS = "gas",
  HEAT = "heat",
  LIGHT = "light",
  LOCK = "lock",
  MOISTURE = "moisture",
  MOTION = "motion",
  MOVING = "moving",
  OCCUPANCY = "occupancy",
  OPENING = "opening",
  PLUG = "plug",
  POWER = "power",
  PRESENCE = "presence",
  PROBLEM = "problem",
  RUNNING = "running",
  SAFETY = "safety",
  SMOKE = "smoke",
  SOUND = "sound",
  TAMPER = "tamper",
  UPDATE = "update",
  VIBRATION = "vibration",
  WINDOW = "window",
}

export interface BinarySensorAttributes extends EntityAttributes {
  device_class?: BinarySensorDeviceClass;
}
