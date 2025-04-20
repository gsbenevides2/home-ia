import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CodespacesSensor } from "../../../../clients/homeAssistant/MySensors/CodespacesSensor.ts";
import { Logger } from "../../../../logger/index.ts";
import { AbstractTool } from "../../AbstractTool.ts";

const args = {} as const;
type Args = typeof args;

export class GetCodespacesStatusTool extends AbstractTool<Args> {
  name = "get-the-codespaces-machine";
  description =
    "Get the status of the Google Cloud virtual machine on Conpute Engine called Codespaces to check if it is running or not";
  args = args;

  execute: ToolCallback<Args> = async () => {
    Logger.info(
      "MCP Server - GetCodespacesStatusTool",
      "Getting codespaces status",
    );
    try {
      const codespacesStatus =
        await CodespacesSensor.getInstance().getCodespacesStatus();
      Logger.info(
        "MCP Server - GetCodespacesStatusTool",
        "Codespaces status retrieved",
        codespacesStatus,
      );
      return {
        content: [
          {
            type: "text",
            text: `The codespaces status is ${codespacesStatus}`,
          },
        ],
      };
    } catch (error) {
      Logger.error(
        "MCP Server - GetCodespacesStatusTool",
        "Error getting codespaces status",
        error,
      );
      return {
        content: [
          {
            type: "text",
            text: "Has occurred an error while getting the codespaces status",
          },
        ],
      };
    }
  };
}
