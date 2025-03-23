import { CodespacesComputeEngineMachine } from "../clients/CodespacesComputeEngineMachine.ts";
import { addToQueue, Operations } from "../queue.ts";

export async function codespacesStart() {
  const codespacesCompute = await CodespacesComputeEngineMachine.getInstance();
  await codespacesCompute.startMachine();
  await addToQueue(Operations.updateCodespacesSensor);
}
