import { asyncFind } from "../../../utils/arrays.ts";
import { SensorAttributes, SensorDeviceClass, Switch } from "../AbstractEntities/Switch.ts";

export type FanSensorsRooms = (typeof FanSensors.rooms)[number];
export type Velocities = Record<string, Switch<SensorAttributes>>;

export const FanSensors = {
  rooms: ["Quarto Gui"] as const,
  switches: {
    "Quarto Gui": {
      alta: new Switch("switch.ventilador_alta", "switch.ventilador_alta", {
        friendly_name: "Alta",
        device_class: SensorDeviceClass.SWITCH,
      }),
      baixa: new Switch("switch.ventilador_baixa", "switch.ventilador_baixa", {
        friendly_name: "Baixa",
        device_class: SensorDeviceClass.SWITCH,
      }),
      media: new Switch("switch.ventilador_media", "switch.ventilador_media", {
        friendly_name: "Média",
        device_class: SensorDeviceClass.SWITCH,
      }),
    } as Velocities,
  },
  async getFanRoom(room: (typeof this.rooms)[number]) {
    const roomData = this.switches[room];
    const velocities = Object.keys(roomData) as (keyof typeof roomData)[];
    const states = await asyncFind(velocities, async (velocity) => {
      const state = await roomData[velocity].getData();
      return state.state === "on";
    });
    return states ?? "off";
  },
};
