import { CodespacesComputeEngineMachine } from "../../clients/CodespacesComputeEngineMachine.ts";
import { addToQueue } from "../queue.ts";

export async function codespacesToggle() {
  const codespacesCompute = await CodespacesComputeEngineMachine.getInstance();
  await codespacesCompute.toogleMachine();
  await addToQueue("update-codespaces-sensor");
}
