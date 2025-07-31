import { InstancesClient } from '@google-cloud/compute'
import { Logger } from '../../logger/index.ts'
import { AuthCredentials } from './AuthCrendentials.ts'

export enum CodespacesInstanceStatus {
  PROVISIONING = 'PROVISIONING',
  STAGING = 'STAGING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  SUSPENDING = 'SUSPENDING',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  REPAIRING = 'REPAIRING'
}

const StatesToStart = [
  CodespacesInstanceStatus.STOPPED,
  CodespacesInstanceStatus.TERMINATED,
  CodespacesInstanceStatus.SUSPENDED
]

const StatesToStop = [CodespacesInstanceStatus.RUNNING]
export class CodespacesComputeEngineMachine {
  private static instance: CodespacesComputeEngineMachine =
    new CodespacesComputeEngineMachine()
  private constructor() {}
  static getInstance() {
    return this.instance
  }

  private instanceClient: InstancesClient | null = null

  private getInstanceClient() {
    if (!this.instanceClient) {
      Logger.info('CodespacesComputeEngineMachine', 'Getting instance client')
      const { credentials, projectId } =
        AuthCredentials.getInstance().getCredentials()

      Logger.info(
        'CodespacesComputeEngineMachine',
        'Using service account:',
        credentials.client_email
      )
      Logger.info('CodespacesComputeEngineMachine', 'Project ID:', projectId)

      this.instanceClient = new InstancesClient({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        projectId: projectId,
        fallback: 'rest'
      })
    }
    return this.instanceClient
  }

  private instanceData = {
    project: Bun.env.CODESPACES_INSTANCE_PROJECT_ID,
    zone: Bun.env.CODESPACES_INSTANCE_ZONE,
    instance: Bun.env.CODESPACES_INSTANCE_NAME
  }

  async toogleMachine() {
    Logger.info('CodespacesComputeEngineMachine', 'Toggling machine')
    const status = await this.getMachineStatus()
    if (StatesToStop.includes(status)) {
      await this.stopMachine()
    } else if (StatesToStart.includes(status)) {
      await this.startMachine()
    } else {
      throw new Error(`Instance is in an invalid state: ${status}`)
    }
  }

  async startMachine() {
    Logger.info('CodespacesComputeEngineMachine', 'Starting machine')
    await this.getInstanceClient().start(this.instanceData)
  }

  async stopMachine() {
    Logger.info('CodespacesComputeEngineMachine', 'Stopping machine')
    await this.getInstanceClient().stop(this.instanceData)
  }

  async getMachineStatus() {
    Logger.info('CodespacesComputeEngineMachine', 'Getting machine status')
    const [instanceGetResult] = await this.getInstanceClient().get(
      this.instanceData
    )
    const status = instanceGetResult.status as CodespacesInstanceStatus
    Logger.info('CodespacesComputeEngineMachine', 'Machine status', { status })
    return status
  }
}
