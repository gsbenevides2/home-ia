import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { availableLightsNames, TuyaLight } from "../../../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { Logger } from "../../../../logger/index.ts";
import { AbstractTool } from "../../AbstractTool.ts";

const args = {
  roomName: z.enum(availableLightsNames).describe("The name of the room where the smart light is installed (e.g., 'bedroom', 'living_room')"),
} as const;

type Args = typeof args;

export class GetRoomLampBrightnessTool extends AbstractTool<Args> {
  name = "get-room-light-brightness";
  description = "Retrieves the current brightness in percentage of a specific room's smart light";
  args = args;

  execute: ToolCallback<Args> = async (args) => {
    const roomName = args.roomName;
    Logger.info("MCP Server - GetRoomLampBrightnessTool", "Getting lamp brightness", args);
    try {
      const lightBrightness = await TuyaLight.getLightBrightness(roomName);
      Logger.info("MCP Server - GetRoomLampBrightnessTool", "Lamp brightness retrieved", lightBrightness);
      return {
        content: [
          {
            type: "text",
            text: `The light in the ${roomName} is has ${lightBrightness}% brightness`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - GetRoomLampBrightnessTool", "Error getting lamp brightness", error);
      return {
        content: [{ type: "text", text: `An error occurred while getting the light brightness for ${roomName}.` }],
      };
    }
  };
}
