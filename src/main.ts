process.env.TZ = 'America/Sao_Paulo'

import cookieParser from 'cookie-parser'
import express from 'express'
import path from 'path'
import { DiscordBot } from './discord/index.ts'
import { Logger } from './logger/index.ts'
import { MCPSSEClientSingleton } from './mcp/client/sse.ts'
import authenticationRouter from './routers/authentication.ts'
import cameraRouter from './routers/camera.ts'
import frontendRouter from './routers/frontend.tsx'
import googleOauthRouter from './routers/googleOauth.tsx'
import mcpRouter from './routers/mcp.ts'
import queueRouters from './routers/queue.ts'
import { Scheduller } from './scheduller/index.ts'

// Build tailwind css
await Bun.$`bunx tailwindcss -i src/tailwind.css -o public/css/tailwind.css --minify`

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(authenticationRouter)
app.use(googleOauthRouter)
app.use(mcpRouter)
app.use(queueRouters)
app.use(cameraRouter)

// Servir arquivos estáticos para vídeo HLS
app.use('/video', express.static(path.join(process.cwd(), 'public', 'video')))

// Sempre por último: rotas de frontend
app.use(frontendRouter)

const port = Bun.env.PORT

if (!port) {
  throw new Error('PORT not set')
}
const server = app.listen(port, async () => {
  Logger.info('HTTP Server', `API is running on port ${port}`)
  if (Bun.env.ENABLE_DISCORD === 'true') {
    await DiscordBot.getInstance().connect()
  }
  await Scheduller.init()
})

process.on('SIGINT', async () => {
  await DiscordBot.getInstance().disconnect()
  await Scheduller.gracefulShutdown()
  await (await MCPSSEClientSingleton.getInstance()).client.close()
  server.close()
  process.exit(0)
})
