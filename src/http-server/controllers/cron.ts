import { CodespacesComputeEngineMachine } from "../../clients/CodespacesComputeEngineMachine.ts";
import { CodespacesSensor } from "../../home-assistant/MySensors/CodespacesSensor.ts";
import { Controllers } from "./types.ts";

export const CronControllers: Controllers = (router) => {
  router.get("/cron", async () => {
    // Codespaces Sensor Update
    const codespacesComputeEngineMachine = CodespacesComputeEngineMachine.getInstance();
    const codespacesSensor = CodespacesSensor.getInstance();
    const status = await codespacesComputeEngineMachine.getMachineStatus();
    await codespacesSensor.sendState(status);

    return {
      status: "ok",
    };
  });
};
