import { type NextFunction, type Request, type Response, Router } from 'express'
import { transports } from '../mcp/server'
const authenticationRouter = Router()

authenticationRouter.use((req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string

  if (req.path === '/sse' && req.query.token === Bun.env.AUTH_TOKEN) {
    next()
    return
  } else if (
    req.path === '/messages' &&
    Object.keys(transports).includes(req.query.sessionId as string)
  ) {
    next()
    return
  }

  if (token === Bun.env.AUTH_TOKEN) {
    next()
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
})

export default authenticationRouter
