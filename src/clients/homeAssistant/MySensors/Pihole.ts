import { SensorDeviceClass, Switch } from "../AbstractEntities/Switch";

export const Pihole = {
  sensor: new Switch("switch.pi_hole_2", "switch.pi_hole_2", {
    friendly_name: "Pihole",
    device_class: SensorDeviceClass.SWITCH,
  }),

  async getStatus() {
    const { state } = await this.sensor.getData();
    return state === "on" ? "on" : "off";
  },

  async toggleStatus() {
    await this.sensor.updateService("switch", "toggle");
  },

  async turnOn() {
    await this.sensor.updateService("switch", "turn_on");
  },

  async turnOff() {
    await this.sensor.updateService("switch", "turn_off");
  },
};
