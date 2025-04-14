import { z } from "zod";
import { CodespacesSensor } from "../../clients/homeAssistant/MySensors/CodespacesSensor.ts";
import { AbstractTool, ToolExecuteResult } from "./AbstractTool.ts";

export class GetCodespacesStatusTool extends AbstractTool {
  name = "get-codespaces-status";
  description = "Get the status of the Google Cloud virtual machine on Conpute Engine called Codespaces";
  parameters = {};

  async execute(_: z.infer<z.ZodType<typeof this.parameters>>): Promise<ToolExecuteResult> {
    const codespacesStatus = await CodespacesSensor.getInstance().getCodespacesStatus();
    return {
      content: [
        {
          type: "text",
          text: `The codespaces status is ${codespacesStatus}`,
        },
      ],
    };
  }
}
