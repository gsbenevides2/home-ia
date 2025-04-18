import { z } from "zod";
import { AvailableLightsNames, availableLightsNames, TuyaLight } from "../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { Logger } from "../../logger/index.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export class SetRoomLampBrightnessTool extends AbstractTool {
  name = "set-lamp-brightness";
  description = "Set the brightness of the lamp";
  parameters = {
    roomName: z.enum(availableLightsNames).describe("The name of the room"),
    brightness: z.number().describe("The brightness of the lamp (0-100)").min(0).max(100),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    Logger.info("MCP Server - SetRoomLampBrightnessTool", "Setting lamp brightness", parameters);
    try {
      await TuyaLight.setLightBrightness(parameters.roomName as unknown as AvailableLightsNames, parameters.brightness as unknown as number);
      Logger.info("MCP Server - SetRoomLampBrightnessTool", "Lamp brightness set", parameters);
      return {
        content: [
          {
            type: "text",
            text: `The lamp in the ${parameters.roomName} the brightness is ${parameters.brightness}`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - SetRoomLampBrightnessTool", "Error setting lamp brightness", error);
      return {
        content: [{ type: "text", text: "Has occurred an error while setting the lamp brightness" }],
      };
    }
  }
}
