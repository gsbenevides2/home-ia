import { z } from "zod";
import { AvailableLightsNames, availableLightsNames, TuyaLight } from "../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { Logger } from "../../logger/index.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export class SetRoomLampTool extends AbstractTool {
  name = "set-lamp-status";
  description = "Set the status of the lamp";
  parameters = {
    roomName: z.enum(availableLightsNames).describe("The name of the room"),
    status: z.enum(["on", "off"]).describe("The status of the lamp"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    Logger.info("MCP Server - SetRoomLampTool", "Setting lamp status", parameters);
    try {
      await TuyaLight.setLightState(parameters.roomName as unknown as AvailableLightsNames, parameters.status as unknown as "on" | "off");
      Logger.info("MCP Server - SetRoomLampTool", "Lamp status set", parameters);
      return {
        content: [
          {
            type: "text",
            text: `The lamp in the ${parameters.roomName} is turned ${parameters.status}`,
          },
        ],
      };
    } catch (error) {
      Logger.error("MCP Server - SetRoomLampTool", "Error setting lamp status", error);
      return {
        content: [{ type: "text", text: "Has occurred an error while setting the lamp status" }],
      };
    }
  }
}
