import { McpServer } from "@modelcontextprotocol/sdk";
import { z } from "zod";

export type Parameters = {
  [key: string]: z.ZodSchema;
};

export type ToolExecuteResult = {
  content: {
    type: "text";
    text: string;
  }[];
};

export abstract class AbstractTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: Parameters;

  abstract execute(parameters: z.infer<z.ZodType<Parameters>>): Promise<ToolExecuteResult>;

  serverRegister(server: McpServer) {
    server.tool(this.name, this.description, this.parameters, this.execute);
    return server;
  }
}
