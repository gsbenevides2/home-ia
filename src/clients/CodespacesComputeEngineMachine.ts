import { InstancesClient } from "@google-cloud/compute";
import { Buffer } from "node:buffer";
import { Logger } from "../logger/index.ts";

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

  private instanceClient: InstancesClient | null = null;

  private getInstanceClient() {
    if (!this.instanceClient) {
      const projectId = Bun.env.GCP_SERVICE_ACCOUNT_PROJECT_ID;
      const clientEmail = Bun.env.GCP_SERVICE_ACCOUNT_CLIENT_EMAIL;
      const privateKey = Buffer.from(Bun.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY ?? "", "base64").toString("ascii");

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Missing required GCP credentials in environment variables");
      }

      Logger.info("CodespacesComputeEngineMachine", "Using service account:", clientEmail);
      Logger.info("CodespacesComputeEngineMachine", "Project ID:", projectId);

      this.instanceClient = new InstancesClient({
        credentials: {
          type: "service_account",
          project_id: projectId,
          private_key_id: Bun.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
          private_key: privateKey,
          client_email: clientEmail,
          client_id: Bun.env.GCP_SERVICE_ACCOUNT_CLIENT_ID,
          token_url: Bun.env.GCP_SERVICE_ACCOUNT_TOKEN_URL,
          universe_domain: Bun.env.GCP_SERVICE_ACCOUNT_UNIVERSE_DOMAIN,
        },
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        projectId: projectId,
      });
    }
    return this.instanceClient;
  }

  private instanceData = {
    project: Bun.env.CODESPACES_INSTANCE_PROJECT_ID,
    zone: Bun.env.CODESPACES_INSTANCE_ZONE,
    instance: Bun.env.CODESPACES_INSTANCE_NAME,
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
    await this.getInstanceClient().start(this.instanceData);
  }

  async stopMachine() {
    await this.getInstanceClient().stop(this.instanceData);
  }

  async getMachineStatus() {
    const [instanceGetResult] = await this.getInstanceClient().get(this.instanceData);
    const status = instanceGetResult.status as CodespacesInstanceStatus;
    return status;
  }
}
