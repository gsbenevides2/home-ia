import { Client as SDKMCPClient } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js'
import { EnvironmentOAuthProvider } from './EnvironmentOAuthProvider'

type Tools = Awaited<
  ReturnType<typeof SDKMCPClient.prototype.listTools>
>['tools']

export class MCPSSEClientSingleton {
  private static instance: SDKMCPClient
  private static tools: Tools = []

  public static readonly timeout: number = DEFAULT_REQUEST_TIMEOUT_MSEC * 2
  private constructor() {}

  public static async getInstance(): Promise<{
    client: SDKMCPClient
    tools: Tools
  }> {
    if (MCPSSEClientSingleton.instance)
      return {
        client: MCPSSEClientSingleton.instance,
        tools: MCPSSEClientSingleton.tools
      }
    const mcpClient = new SDKMCPClient({
      name: 'mcp-client-cli',
      version: '1.0.0'
    })
    await mcpClient.connect(
      new SSEClientTransport(new URL('http://localhost:3000/sse'), {
        authProvider: new EnvironmentOAuthProvider()
      })
    )
    const toolsResult = await mcpClient.listTools()
    MCPSSEClientSingleton.tools = toolsResult.tools
    return {
      client: mcpClient,
      tools: MCPSSEClientSingleton.tools
    }
  }
}
