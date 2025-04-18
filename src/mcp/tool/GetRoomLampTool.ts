import { z } from "zod";
import { Logger } from "../../logger/index.ts";
import { AvailableLightsNames, availableLightsNames, TuyaLight } from "./../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export class GetRoomLampTool extends AbstractTool {
  name = "get-lamp-status";
  description = "Get the status of the lamp";
  parameters = {
    roomName: z.enum(availableLightsNames).describe("The name of the room"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    Logger.info("MCP Server - GetRoomLampTool", "Getting lamp status", parameters);
    try {
      const lightState = await TuyaLight.getLightState(parameters.roomName as unknown as AvailableLightsNames);
      Logger.info("MCP Server - GetRoomLampTool", "Lamp status retrieved", lightState);
      return {
        content: [
          {
            type: "text",
            text: `The lamp in the ${parameters.roomName} is ${lightState}`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - GetRoomLampTool", "Error getting lamp status", error);
      return {
        content: [{ type: "text", text: "Has occurred an error while getting the lamp status" }],
      };
    }
  }
}
