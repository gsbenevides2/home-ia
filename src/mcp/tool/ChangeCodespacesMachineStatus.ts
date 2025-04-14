import { z } from "zod";
import { addToQueue } from "../../queue/queue.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export class ChangeCodespacesStatusTool extends AbstractTool {
  name = "change-codespaces-status";
  description = "Chnage the status of the Google Cloud virtual machine on Conpute Engine called Codespaces";
  parameters = {
    status: z.enum(["start", "stop"]).describe("The status of the codespaces"),
  };

  async execute(parameters: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    const status = parameters.status as unknown as "start" | "stop";
    addToQueue(status === "start" ? "codespaces-start" : "codespaces-stop");

    return {
      content: [
        {
          type: "text",
          text: `The codespaces machine is being ${parameters.status}ed`,
        },
      ],
    };
  }
}
