import { Router } from 'express'
import { MCPServer } from '../mcp/server/index.ts'
const mcpRouter = Router()

const mcpServer = MCPServer.getInstance()

mcpRouter.get('/sse', (req, res) => {
  mcpServer.connectSSE(req, res)
})
mcpRouter.post('/messages', (req, res) => {
  mcpServer.handleSSEPostMessage(req, res)
})
mcpRouter.all('/mcp', (req, res) => {
  mcpServer.handleStreamable(req, res)
})

export default mcpRouter
