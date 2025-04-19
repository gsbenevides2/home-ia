import { z } from "zod";
import { FanSensors, FanSensorsRooms } from "../../../../clients/homeAssistant/MySensors/FanSensors.ts";
import { Logger } from "../../../../logger/index.ts";
import { AbstractTool, ToolExecuteResult } from "../../AbstractTool.ts";

export class GetRoomFanStatusTool extends AbstractTool {
  name = "get-fan-status";
  description = "Get the status of the lamp";
  parameters = {
    roomName: z.enum(FanSensors.rooms).describe("The name of the room"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    Logger.info("MCP Server - GetRoomFanStatusTool", "Getting fan status", parameters);
    try {
      const fanState = await FanSensors.getFanRoom(parameters.roomName as unknown as FanSensorsRooms);
      Logger.info("MCP Server - GetRoomFanStatusTool", "Fan status retrieved", fanState);
      return {
        content: [
          {
            type: "text",
            text: `The fan in the ${parameters.roomName} is ${fanState}`,
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
