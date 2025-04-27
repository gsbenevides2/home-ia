import { CodespacesComputeEngineMachine } from '../../clients/google/CodespacesComputeEngineMachine.ts'
import { addToQueue } from '../queue.ts'

export async function codespacesStart() {
  const codespacesCompute = await CodespacesComputeEngineMachine.getInstance()
  await codespacesCompute.startMachine()
  await addToQueue('update-codespaces-sensor')
}
