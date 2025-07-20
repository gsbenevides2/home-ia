/*
  This is the old server implementation.
  It is not used anymore.
  It is kept here for reference.
  It is replaced by the new implementation in the routers/mcp.ts file.
*/
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import console from 'node:console'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { registerTools } from '../tool/index.ts'
import { TransportsManager } from './transportsManager.ts'

export class MCPServer {
  private static instance: MCPServer
  public static getInstance(): MCPServer {
    if (!MCPServer.instance) {
      MCPServer.instance = new MCPServer()
    }
    return MCPServer.instance
  }

  private server: McpServer

  private constructor() {
    this.server = new McpServer({
      name: 'home-assistant-model-context-protocol-server',
      version: '0.0.1'
    })
    registerTools(this.server)
  }

  public getServer() {
    return this.server
  }

  private transports = new TransportsManager()

  public getMCPServerPaths() {
    return ['/sse', '/messages', '/mcp']
  }

  private checkSessionId(sessionId: string) {
    return this.transports.checkSessionId(sessionId)
  }

  public async handleAuthentication(
    req: Request
  ): Promise<Response | 'continue'> {
    const url = new URL(req.url)
    const token = url.searchParams.get('token') as string
    const sessionIdQueryParam = url.searchParams.get('sessionId') as string
    const headerToken = req.headers.get('Authorization')?.split(' ')[1]
    const mcpSessionIdHeader = req.headers.get('mcp-session-id')
    const sessionId = sessionIdQueryParam ?? mcpSessionIdHeader ?? ''
    const isAuthenticated = this.checkSessionId(sessionId)

    if (isAuthenticated) {
      return 'continue'
    }

    if (token === Bun.env.AUTH_TOKEN || headerToken === Bun.env.AUTH_TOKEN) {
      return 'continue'
    }
    return new Response('Unauthorized', { status: 401 })
  }

  public async connectSSE(res: ServerResponse) {
    const transport = new SSEServerTransport('/messages', res)
    console.log('transport', transport)
    this.transports.addSSE(transport.sessionId, transport)
    res.on('close', () => {
      this.transports.removeSSE(transport.sessionId)
    })
    await this.server.connect(transport)
  }

  public async handleSSEPostMessage(
    req: IncomingMessage,
    body: unknown,
    res: ServerResponse
  ) {
    if (!req.url) throw new Error('Request URL is required')
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId') as string
    const transport = this.transports.getSSE(sessionId)
    if (transport) {
      await transport.handlePostMessage(req, res, body)
    } else {
      res.statusCode = 400
      res.end('No transport found for sessionId')
    }
  }

  public async handleStreamable(
    req: IncomingMessage,
    body: unknown,
    res: ServerResponse
  ) {
    const method = req.method?.toLowerCase()
    switch (method) {
      case 'post':
        await this.handleStreamablePost(req, body, res)
        break
      case 'get':
        await this.handleStreamableGetDelete(req, res)
        break
      case 'delete':
        await this.handleStreamableGetDelete(req, res)
        break
    }
  }

  public async handleStreamablePost(
    req: IncomingMessage,
    body: unknown,
    res: ServerResponse
  ) {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport: StreamableHTTPServerTransport | undefined
    if (sessionId && this.transports.getStreamable(sessionId)) {
      // Reuse existing transport
      transport = this.transports.getStreamable(
        sessionId
      ) as StreamableHTTPServerTransport
    } else if (!sessionId && isInitializeRequest(body)) {
      // Create new transport
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: sessionId => {
          // Store the transport by session ID
          this.transports.addStreamable(
            sessionId,
            transport as StreamableHTTPServerTransport
          )
        }
      })
      transport.onclose = () => {
        if (transport?.sessionId) {
          this.transports.removeStreamable(transport.sessionId)
        }
      }
      await this.server.connect(transport)
    } else {
      res.statusCode = 400
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided'
          },
          id: null
        })
      )
      return
    }

    // Handle the request
    await transport.handleRequest(req, res, body)
  }

  public async handleStreamableGetDelete(
    req: IncomingMessage,
    res: ServerResponse
  ) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (!sessionId || !this.transports.getStreamable(sessionId)) {
      res.statusCode = 400
      res.end('Invalid or missing session ID')
      return
    }

    const transport = this.transports.getStreamable(
      sessionId
    ) as StreamableHTTPServerTransport
    await transport.handleRequest(req, res)
  }
}
