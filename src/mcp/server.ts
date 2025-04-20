import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { registerTools } from './tool/index.ts'

export const mcpServer = new McpServer({
  name: 'home-assistant-model-context-protocol-server',
  version: '0.0.1'
})
registerTools(mcpServer)

export const transports: { [sessionId: string]: SSEServerTransport } = {}

export class MCPServerTracerID {
  private static instance: MCPServerTracerID
  private constructor() {}
  private static tracerId: string | null = null
  public static setTracerId(tracerId: string) {
    this.tracerId = tracerId
  }
  public static getTracerId(): string {
    return this.tracerId ?? ''
  }
}
