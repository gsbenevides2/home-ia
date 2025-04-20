import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.d.ts";
import { z, type ZodRawShape } from "zod";

export type Parameters = {
  [key: string]: z.ZodSchema;
};

export type ToolExecuteResult = {
  content: {
    type: "text";
    text: string;
  }[];
};

export abstract class AbstractTool<P extends ZodRawShape> {
  abstract name: string;
  abstract description: string;
  abstract args: P;

  abstract execute: ToolCallback<P>;

  serverRegister(server: McpServer) {
    server.tool(this.name, this.description, this.args, this.execute);
    return server;
  }
}
