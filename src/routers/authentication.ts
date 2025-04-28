import { type NextFunction, type Request, type Response, Router } from 'express'
import { OauthClient } from '../clients/google/OauthClient'
import { MCPServer } from '../mcp/server'

const authenticationRouter = Router()

const mcpServer = MCPServer.getInstance()
const oauthClient = OauthClient.getInstance()

const unprotectedPaths = [
  oauthClient.staterUrl.pathname,
  oauthClient.redirectUri.pathname
]

authenticationRouter.use(
  async (req: Request, res: Response, next: NextFunction) => {
    if (unprotectedPaths.includes(req.path)) {
      next()
      return
    }

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
