import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { randomUUIDv7 } from 'bun'
import Elysia from 'elysia'
import { mcp } from 'elysia-mcp'
import { registerTools } from '../mcp/tool'
import { envAuthToken } from './authentication'

const mcpElysiaRouter = new Elysia().use(
  mcp({
    serverInfo: {
      name: 'home-assistant-model-context-protocol-server',
      version: '0.0.1'
    },
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      logging: {}
    },
    basePath: '/mcp',
    authentication: async context => {
      const headers = context.request.headers
      const authorization = headers.get('authorization')
      if (!authorization) {
        return context.status('Unauthorized', 'Is missing Authorization header')
      }
      const token = authorization.split(' ')[1]
      if (token !== envAuthToken) {
        return context.status('Unauthorized', 'Your token is invalid')
      }
      const sessionId = headers.get('mcp-session-id')

      if (!sessionId) {
        return {
          authInfo: {
            sessionId: randomUUIDv7()
          }
        }
      }
      return {
        authInfo: {
          sessionId
        }
      }
    },
    setupServer: async (server: McpServer) => {
      registerTools(server)
    }
  })
)

export default mcpElysiaRouter
