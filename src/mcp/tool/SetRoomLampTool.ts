import { z } from "zod";
import { AvailableLightsNames, availableLightsNames, TuyaLight } from "../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export class SetRoomLampTool extends AbstractTool {
  name = "set-lamp-status";
  description = "Set the status of the lamp";
  parameters = {
    roomName: z.enum(availableLightsNames).describe("The name of the room"),
    status: z.enum(["on", "off"]).describe("The status of the lamp"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    await TuyaLight.setLightState(parameters.roomName as unknown as AvailableLightsNames, parameters.status as unknown as "on" | "off");
    return {
      content: [
        {
          type: "text",
          text: `The lamp in the ${parameters.roomName} is turned ${parameters.status}`,
        },
      ],
    };
  }
}
