import { z } from "zod";
import { AvailableLightsNames, availableLightsNames, TuyaLight } from "./../../clients/homeAssistant/MySensors/TuyaLight.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export class GetRoomLampTool extends AbstractTool {
  name = "get-lamp-status";
  description = "Get the status of the lamp";
  parameters = {
    roomName: z.enum(availableLightsNames).describe("The name of the room"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    console.log(parameters.roomName);
    const lightState = await TuyaLight.getLightState(parameters.roomName as unknown as AvailableLightsNames);
    console.log(lightState);
    return {
      content: [
        {
          type: "text",
          text: `The lamp in the ${parameters.roomName} is ${lightState}`,
        },
      ],
    };
  }
}
