import { BinarySensor, BinarySensorDeviceClass } from "../AbstractEntities/BinarySensor.ts";

export const availableLightsNames = ["Quarto Gui", "Quarto Ana"] as const;
export type AvailableLightsNames = (typeof availableLightsNames)[number];

export type AvailableLightsId = {
  [key in AvailableLightsNames]: string;
};

export const lightsId: AvailableLightsId = {
  "Quarto Gui": "quarto_gui",
  "Quarto Ana": "quarto_ana",
};

export class TuyaLight {
  public static async getLightState(light: AvailableLightsNames) {
    const sensorId = `light.${lightsId[light]}`;
    const sensor = new BinarySensor(sensorId, sensorId, {
      friendly_name: light,
      device_class: BinarySensorDeviceClass.LIGHT,
    });
    const { state } = await sensor.getData();
    return state;
  }

  public static async setLightState(light: AvailableLightsNames, state: "on" | "off") {
    const sensorId = `light.${lightsId[light]}`;
    const sensor = new BinarySensor(sensorId, sensorId, {
      friendly_name: light,
      device_class: BinarySensorDeviceClass.LIGHT,
    });
    await sensor.updateService("light", state === "on" ? "turn_on" : "turn_off");
  }

  public static async setLightBrightness(light: AvailableLightsNames, brightness: number) {
    const sensorId = `light.${lightsId[light]}`;
    const sensor = new BinarySensor(sensorId, sensorId, {
      friendly_name: light,
      device_class: BinarySensorDeviceClass.LIGHT,
    });

    await sensor.updateService("light", "turn_on", { brightness_pct: brightness });
  }
}
