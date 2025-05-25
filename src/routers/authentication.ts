import { type NextFunction, type Request, type Response, Router } from 'express'
import { match } from 'path-to-regexp'
import { MCPServer } from '../mcp/server'

const authenticationRouter = Router()

const mcpServer = MCPServer.getInstance()

const unprotectedPathsPatterns = [
  '/login',
  '/css/:file',
  '/fonts/:file',
  '/js/:file'
]

authenticationRouter.use(
  async (req: Request, res: Response, next: NextFunction) => {
    const acceptHeader = req.headers.accept
    const isFromBrowser = acceptHeader?.includes('text/html')
    const isUnprotectedPath = unprotectedPathsPatterns.some(pattern =>
      match(pattern)(req.path)
    )
    if (isUnprotectedPath) {
      next()
      return
    }

    if (mcpServer.getMCPServerPaths().includes(req.path)) {
      await mcpServer.handleAuthentication(req, res, next)
      return
    }

    const authorizationCookie = req.cookies.authorization
    if (authorizationCookie === `Bearer ${Bun.env.AUTH_TOKEN}`) {
      next()
      return
    }

    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader) {
      if (isFromBrowser) {
        return res.redirect('/login')
      }
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (authorizationHeader === `Bearer ${Bun.env.AUTH_TOKEN}`) {
      next()
    } else {
      if (isFromBrowser) {
        return res.redirect('/login')
      }
      return res.status(401).json({ message: 'Unauthorized' })
    }
  }
)

const envUserName = Bun.env.LOGIN_USERNAME
const envPassword = Bun.env.LOGIN_PASSWORD

authenticationRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body
  const isFromBrowser = req.headers.accept?.includes('text/html')

  if (username === envUserName && password === envPassword) {
    if (isFromBrowser) {
      res.cookie('authorization', `Bearer ${Bun.env.AUTH_TOKEN}`)
      return res.redirect('/')
    }
    return res.json({ message: 'Logged in successfully' })
  }
  if (isFromBrowser) {
    return res.redirect(`/login?error=true`)
  }
  return res.status(401).json({ message: 'Unauthorized' })
})

authenticationRouter.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('authorization')
  return res.redirect('/')
})

export default authenticationRouter
