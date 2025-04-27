import { type NextFunction, type Request, type Response, Router } from 'express'
import { MCPServer } from '../mcp/server'
const authenticationRouter = Router()

const mcpServer = MCPServer.getInstance()

authenticationRouter.use(
  async (req: Request, res: Response, next: NextFunction) => {
    if (mcpServer.getMCPServerPaths().includes(req.path)) {
      await mcpServer.handleAuthentication(req, res, next)
      return
    }

    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (authorizationHeader === `Bearer ${Bun.env.AUTH_TOKEN}`) {
      next()
    } else {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }
)

export default authenticationRouter
