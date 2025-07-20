import { Elysia } from 'elysia'
import authenticationRouter from './authentication'
import cameraRouter from './camera'
import frontendRouter from './frontend'
import googleOauthRouter from './googleAuth'
import mcpElysiaRouter from './mcp'
import pluggyRouter from './pluggy'
import queueRouter from './queue'
import savedPromptsRouter from './savedPrompts'
import schedulerRouter from './scheduler'
import whatsappRouter from './whatsapp'

import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(cors())
  .use(frontendRouter)
  .use(authenticationRouter)
  .use(cameraRouter)
  .use(googleOauthRouter)
  .use(savedPromptsRouter)
  .use(schedulerRouter)
  .use(whatsappRouter)
  .use(mcpElysiaRouter)
  .use(pluggyRouter)
  .use(queueRouter)

export default app
export type App = typeof app
