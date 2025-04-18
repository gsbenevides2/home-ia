import { z } from "zod";
import { AvailableLightsNames, availableLightsNames, TuyaLight } from "../../../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { Logger } from "../../../../logger/index.ts";
import { AbstractTool, ToolExecuteResult } from "../../AbstractTool.ts";

export class GetRoomLampBrightnessTool extends AbstractTool {
  name = "get-lamp-brightness";
  description = "Get the brightness of the lamp";
  parameters = {
    roomName: z.enum(availableLightsNames).describe("The name of the room"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    Logger.info("MCP Server - GetRoomLampBrightnessTool", "Getting lamp brightness", parameters);
    try {
      const lightBrightness = await TuyaLight.getLightBrightness(parameters.roomName as unknown as AvailableLightsNames);
      Logger.info("MCP Server - GetRoomLampBrightnessTool", "Lamp brightness retrieved", lightBrightness);
      return {
        content: [
          {
            type: "text",
            text: `The lamp in the ${parameters.roomName} is has ${lightBrightness}% brightness`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - GetRoomLampBrightnessTool", "Error getting lamp brightness", error);
      return {
        content: [{ type: "text", text: "Has occurred an error while getting the lamp brightness" }],
      };
    }
  }
}
