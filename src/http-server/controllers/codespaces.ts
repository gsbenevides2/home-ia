import { CodespacesComputeEngineMachine } from "../../clients/CodespacesComputeEngineMachine.ts";
import { CodespacesSensor } from "../../home-assistant/MySensors/CodespacesSensor.ts";
import { Controllers } from "./types.ts";

export const CodespacesControllers: Controllers = (router) => {
  // Toogle Codespaces machine
  router.post("/codespaces", async () => {
    const codespacesCompute = await CodespacesComputeEngineMachine.getInstance();
    await codespacesCompute.toogleMachine();
    const status = await codespacesCompute.getMachineStatus();
    const codespacesSensor = CodespacesSensor.getInstance();
    await codespacesSensor.sendState(status);
    return { status };
  });
};
