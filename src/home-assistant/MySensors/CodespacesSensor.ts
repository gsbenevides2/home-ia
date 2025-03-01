import { CodespacesInstanceStatus } from "../../clients/CodespacesComputeEngineMachine.ts";
import { Sensor, SensorAttributes, SensorDeviceClass } from "../AbstractEntities/Sensor.ts";

interface CodespacesAttributes extends SensorAttributes {
  options: CodespacesInstanceStatus[];
  icon: string;
}

export class CodespacesSensor {
  private static instance: CodespacesSensor = new CodespacesSensor();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  private sensor = new Sensor<CodespacesInstanceStatus, CodespacesAttributes>("codespaces", "codespaces", {
    device_class: SensorDeviceClass.ENUM,
    friendly_name: "Codespaces",
    icon: "mdi:server",
    options: Object.values(CodespacesInstanceStatus),
  });

  async sendState(state: CodespacesInstanceStatus) {
    await this.sensor.sendState(state);
  }
}
