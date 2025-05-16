import { type NextFunction, type Request, type Response, Router } from 'express'
import { OauthClient } from '../clients/google/OauthClient'
import { MCPServer } from '../mcp/server'
import { frontEndRoutes } from './frontend'

const authenticationRouter = Router()

const mcpServer = MCPServer.getInstance()
const oauthClient = OauthClient.getInstance()

// Adicionar acesso para arquivos estáticos de vídeo HLS
const videoPathPatterns = ['/video', '/video/*']

const unprotectedPaths = [
  oauthClient.staterUrl.pathname,
  oauthClient.redirectUri.pathname,
  ...frontEndRoutes,
  ...videoPathPatterns
]

authenticationRouter.use(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes('/cameras/rua')) {
      next()
      return
    }

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
