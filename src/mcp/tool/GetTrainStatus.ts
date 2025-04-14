import { z } from "zod";
import { TrainSensors } from "../../clients/homeAssistant/MySensors/TrainSensors.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export const availableTrainLines = ["one", "two", "three", "four", "five", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"] as const;

export class GetTrainStatus extends AbstractTool {
  name = "get-train-status";
  description = "Get the status of the train";
  parameters = {
    lineCode: z.enum(availableTrainLines).describe("The code of the train line"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    const trainStatus = await TrainSensors.getInstance().getTrainLineData(parameters.lineCode as unknown as string);
    return {
      content: [
        {
          type: "text",
          text: `O status da linha ${trainStatus.attributes.codigo} - ${trainStatus.attributes.cor} é ${trainStatus.state} - ${trainStatus.attributes.descricao ?? "OK"}`,
        },
      ],
    };
  }
}
