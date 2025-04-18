import { z } from "zod";
import { CodespacesSensor } from "../../../../clients/homeAssistant/MySensors/CodespacesSensor.ts";
import { Logger } from "../../../../logger/index.ts";
import { AbstractTool, ToolExecuteResult } from "../../AbstractTool.ts";

export class GetCodespacesStatusTool extends AbstractTool {
  name = "get-codespaces-status";
  description = "Get the status of the Google Cloud virtual machine on Conpute Engine called Codespaces";
  parameters = {};

  async execute(_: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    Logger.info("MCP Server - GetCodespacesStatusTool", "Getting codespaces status");
    try {
      const codespacesStatus = await CodespacesSensor.getInstance().getCodespacesStatus();
      Logger.info("MCP Server - GetCodespacesStatusTool", "Codespaces status retrieved", codespacesStatus);
      return {
        content: [
          {
            type: "text",
            text: `The codespaces status is ${codespacesStatus}`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - GetCodespacesStatusTool", "Error getting codespaces status", error);
      return {
        content: [{ type: "text", text: "Has occurred an error while getting the codespaces status" }],
      };
    }
  }
}
