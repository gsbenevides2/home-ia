import { z } from "zod";
import { TrainSensors } from "../../clients/homeAssistant/MySensors/TrainSensors.ts";
import { Logger } from "../../logger/index.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export const availableTrainLines = ["one", "two", "three", "four", "five", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"] as const;

export class GetTrainStatus extends AbstractTool {
  name = "get-train-status";
  description = "Get the status of the train";
  parameters = {
    lineCode: z.enum(availableTrainLines).describe("The code of the train line"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    Logger.info("MCP Server - GetTrainStatus", "Getting train status", parameters);
    try {
      const trainStatus = await TrainSensors.getInstance().getTrainLineData(parameters.lineCode as unknown as string);
      Logger.info("MCP Server - GetTrainStatus", "Train status retrieved", trainStatus);
      return {
        content: [
          {
            type: "text",
            text: `O status da linha ${trainStatus.attributes.codigo} - ${trainStatus.attributes.cor} é ${trainStatus.state} - ${trainStatus.attributes.descricao ?? "OK"}`,
          },
        ],
      };
    } catch (e) {
      Logger.error("MCP Server - GetTrainStatus", "Error getting train status", e);
      return {
        content: [{ type: "text", text: "Ocorreu um erro ao obter o status da linha" }],
      };
    }
  }
}
