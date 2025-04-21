import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.d.ts'
import { Client as SDKMCPClient } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { OAuthClientMetadata } from '@modelcontextprotocol/sdk/shared/auth.d.ts'
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js'

class EnvironmentOAuthProvider implements OAuthClientProvider {
  redirectUrl = new URL('http://localhost:3000/sse')
  clientMetadata: OAuthClientMetadata = {
    redirect_uris: [this.redirectUrl.toString()]
  }
  clientInformation = () => {
    return {
      client_id: 'mcp-client-cli',
      client_secret: 'mcp-client-cli-secret',
      client_id_issued_at: Date.now(),
      client_secret_expires_at: Date.now() + 1000 * 60 * 60 * 24 * 30
    }
  }
  tokens = () => {
    return {
      access_token: Bun.env.AUTH_TOKEN!,
      token_type: 'Bearer'
    }
  }
  saveTokens = () => {}
  redirectToAuthorization = () => {}
  saveCodeVerifier = () => {}
  codeVerifier = () => {
    return '1234567890'
  }
}

type Tools = Awaited<
  ReturnType<typeof SDKMCPClient.prototype.listTools>
>['tools']

export class MCPClientSingleton {
  private static instance: SDKMCPClient
  private static tools: Tools = []

  public static readonly timeout: number = DEFAULT_REQUEST_TIMEOUT_MSEC * 2
  private constructor() {}

  public static async getInstance(): Promise<{
    client: SDKMCPClient
    tools: Tools
  }> {
    if (MCPClientSingleton.instance)
      return {
        client: MCPClientSingleton.instance,
        tools: MCPClientSingleton.tools
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
    MCPClientSingleton.tools = toolsResult.tools
    return {
      client: mcpClient,
      tools: MCPClientSingleton.tools
    }
  }
}
