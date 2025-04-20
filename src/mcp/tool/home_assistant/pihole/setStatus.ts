import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Pihole } from "../../../../clients/homeAssistant/MySensors/Pihole.ts";
import { Logger } from "../../../../logger/index.ts";
import { AbstractTool } from "../../AbstractTool.ts";

const args = {
  status: z.enum(["on", "off"]).describe("The desired status for Pi-hole (e.g., 'on' to enable, 'off' to disable)"),
} as const;

type Args = typeof args;

export class SetPiholeStatusTool extends AbstractTool<Args> {
  name = "set-pihole-status";
  description = "Enables or disables Pi-hole ad blocking";
  args = args;

  execute: ToolCallback<Args> = async (args) => {
    const status = args.status;
    Logger.info("MCP Server - SetPiholeStatusTool", "Setting Pi-hole status", args);
    try {
      await Pihole.sensor.updateService("switch", status === "on" ? "turn_on" : "turn_off");
      Logger.info("MCP Server - SetPiholeStatusTool", "Pi-hole status changed", status);
      return {
        content: [
          {
            type: "text",
            text: `Pi-hole has been turned ${status}`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - SetPiholeStatusTool", "Error changing Pi-hole status", error);
      return {
        content: [{ type: "text", text: `An error occurred while changing the Pi-hole status.` }],
      };
    }
  };
}
