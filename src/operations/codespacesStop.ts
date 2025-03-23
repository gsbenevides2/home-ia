import { CodespacesComputeEngineMachine } from "../clients/CodespacesComputeEngineMachine.ts";
import { addToQueue, Operations } from "../queue.ts";

export async function codespacesStop() {
  const codespacesCompute = await CodespacesComputeEngineMachine.getInstance();
  await codespacesCompute.stopMachine();
  await addToQueue(Operations.updateCodespacesSensor);
}
