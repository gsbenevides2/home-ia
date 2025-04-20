import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { availableLightsNames, TuyaLight } from "../../../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { Logger } from "../../../../logger/index.ts";
import { AbstractTool } from "../../AbstractTool.ts";

const args = {
  roomName: z.enum(availableLightsNames).describe("The name of the room where the smart light is installed (e.g., 'bedroom', 'living_room')"),
  status: z.enum(["on", "off"]).describe("The desired status of the room's smart light (on/off)"),
} as const;

type Args = typeof args;

export class SetRoomLampTool extends AbstractTool<Args> {
  name = "set-room-light-status";
  description = "Set the status of the room's smart light";
  args = args;

  execute: ToolCallback<Args> = async (args) => {
    const roomName = args.roomName;
    const status = args.status;
    Logger.info("MCP Server - SetRoomLampTool", "Setting lamp status", args);
    try {
      await TuyaLight.setLightState(roomName, status);
      Logger.info("MCP Server - SetRoomLampTool", "Lamp status set", args);
      return {
        content: [
          {
            type: "text",
            text: `The light in the ${roomName} is turned ${status}`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - SetRoomLampTool", "Error setting lamp status", error);
      return {
        content: [{ type: "text", text: `An error occurred while setting the light status for ${roomName}.` }],
      };
    }
  };
}
