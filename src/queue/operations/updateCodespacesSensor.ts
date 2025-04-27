import { CodespacesComputeEngineMachine } from '../../clients/google/CodespacesComputeEngineMachine.ts'
import { CodespacesSensor } from '../../clients/homeAssistant/MySensors/CodespacesSensor.ts'

export async function updateCodespacesSensor() {
  const codespacesCompute = await CodespacesComputeEngineMachine.getInstance()
  const status = await codespacesCompute.getMachineStatus()
  const codespacesSensor = CodespacesSensor.getInstance()
  await codespacesSensor.sendState(status)
}
