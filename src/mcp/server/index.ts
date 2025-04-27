import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
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
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const token = req.query.token as string
    const headerToken = req.headers.authorization?.split(' ')[1]
    const sessionId =
      (req.query.sessionId as string) ??
      (req.headers['mcp-session-id'] as string) ??
      ''
    const isAuthenticated = this.checkSessionId(sessionId)

    if (isAuthenticated) {
      next()
      return
    }

    if (token === Bun.env.AUTH_TOKEN || headerToken === Bun.env.AUTH_TOKEN) {
      next()
      return
    }

    res.status(401).send('Unauthorized')
  }

  public async connectSSE(_req: Request, res: Response) {
    const transport = new SSEServerTransport('/messages', res)
    this.transports.addSSE(transport.sessionId, transport)
    res.on('close', () => {
      this.transports.removeSSE(transport.sessionId)
    })
    await this.server.connect(transport)
  }

  public async handleSSEPostMessage(req: Request, res: Response) {
    const sessionId = req.query.sessionId as string
    const transport = this.transports.getSSE(sessionId)
    if (transport) {
      await transport.handlePostMessage(req, res, req.body)
    } else {
      res.status(400).send('No transport found for sessionId')
    }
  }

  public async handleStreamable(req: Request, res: Response) {
    const method = req.method.toLowerCase()
    switch (method) {
      case 'post':
        await this.handleStreamablePost(req, res)
        break
      case 'get':
        await this.handleStreamableGetDelete(req, res)
        break
      case 'delete':
        await this.handleStreamableGetDelete(req, res)
        break
    }
  }

  public async handleStreamablePost(req: Request, res: Response) {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport: StreamableHTTPServerTransport | undefined
    if (sessionId && this.transports.getStreamable(sessionId)) {
      // Reuse existing transport
      transport = this.transports.getStreamable(
        sessionId
      ) as StreamableHTTPServerTransport
    } else if (!sessionId && isInitializeRequest(req.body)) {
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
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided'
        },
        id: null
      })
      return
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body)
  }

  public async handleStreamableGetDelete(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (!sessionId || !this.transports.getStreamable(sessionId)) {
      res.status(400).send('Invalid or missing session ID')
      return
    }

    const transport = this.transports.getStreamable(
      sessionId
    ) as StreamableHTTPServerTransport
    await transport.handleRequest(req, res)
  }
}
