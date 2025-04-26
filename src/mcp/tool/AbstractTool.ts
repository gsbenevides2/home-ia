import type {
  McpServer,
  ToolCallback
} from '@modelcontextprotocol/sdk/server/mcp.d.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type {
  CallToolResult,
  ServerNotification,
  ServerRequest
} from '@modelcontextprotocol/sdk/types.js'
import { z, type ZodRawShape, type ZodTypeAny } from 'zod'
import { Tracer } from '../../logger/Tracer'

export type Parameters = {
  [key: string]: z.ZodSchema
}

export type ToolExecuteResult = {
  content: {
    type: 'text'
    text: string
  }[]
}

export type OnErrorToolCallback<P extends ZodRawShape> = (
  error: Error,
  args: z.objectOutputType<P, ZodTypeAny>
) => CallToolResult

export abstract class AbstractTool<P extends ZodRawShape> {
  abstract name: string
  abstract description: string
  abstract args: P

  abstract execute: ToolCallback<P>

  abstract onError: OnErrorToolCallback<P>

  serverRegister(server: McpServer) {
    server.tool(
      this.name,
      this.description,
      this.args,
      this.executeSafe as ToolCallback<P>
    )
    return server
  }

  executeSafe = async (
    args: z.objectOutputType<P, ZodTypeAny>,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ) => {
    const tracer = Tracer.getGlobalTracer()
    tracer.setProgram('MCP Server')
    tracer.info('Calling tool', {
      toolName: this.name,
      args
    })
    try {
      const result = await this.execute(args, extra)
      tracer.info('Tool executed', {
        toolName: this.name,
        result
      })
      return result
    } catch (error) {
      console.error(error)
      tracer.error('Tool execution failed', {
        toolName: this.name,
        error: error instanceof Error ? error.message : String(error)
      })
      return this.onError(error as Error, args)
    }
  }
}
