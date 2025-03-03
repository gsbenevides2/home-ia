import { InstancesClient } from "@google-cloud/compute";

export enum CodespacesInstanceStatus {
  PROVISIONING = "PROVISIONING",
  STAGING = "STAGING",
  RUNNING = "RUNNING",
  STOPPING = "STOPPING",
  STOPPED = "STOPPED",
  SUSPENDING = "SUSPENDING",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED",
  REPAIRING = "REPAIRING",
}

const StatesToStart = [CodespacesInstanceStatus.STOPPED, CodespacesInstanceStatus.TERMINATED, CodespacesInstanceStatus.SUSPENDED];

const StatesToStop = [CodespacesInstanceStatus.RUNNING];
export class CodespacesComputeEngineMachine {
  private static instance: CodespacesComputeEngineMachine = new CodespacesComputeEngineMachine();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  private instancesClient = new InstancesClient();

  private instanceData = {
    project: Deno.env.get("INSTANCE_CLIENT_PROJECT_ID"),
    zone: Deno.env.get("INSTANCE_CLIENT_ZONE"),
    instance: Deno.env.get("INSTANCE_CLIENT_INSTANCE_NAME"),
  };

  async toogleMachine() {
    const status = await this.getMachineStatus();
    if (StatesToStop.includes(status)) {
      await this.stopMachine();
    } else if (StatesToStart.includes(status)) {
      await this.startMachine();
    } else {
      throw new Error(`Instance is in an invalid state: ${status}`);
    }
  }

  async startMachine() {
    await this.instancesClient.start(this.instanceData);
  }

  async stopMachine() {
    await this.instancesClient.stop(this.instanceData);
  }

  async getMachineStatus() {
    const [instanceGetResult] = await this.instancesClient.get(this.instanceData);
    const status = instanceGetResult.status as CodespacesInstanceStatus;
    return status;
  }
}
