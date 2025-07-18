process.env.TZ = 'America/Sao_Paulo'

import cookieParser from 'cookie-parser'
import express from 'express'
import path from 'path'
import { Cameras } from './clients/Camera/CamerasSingleton.ts'
import { DiscordBot } from './discord/index.ts'
import { Logger } from './logger/index.ts'
import { MCPSSEClientSingleton } from './mcp/client/sse.ts'
import authenticationRouter from './routers/authentication.ts'
import cameraRouter from './routers/camera.ts'
import frontendRouter from './routers/frontend.tsx'
import googleOauthRouter from './routers/googleOauth.tsx'
import mcpRouter from './routers/mcp.ts'
import pluggyRouter from './routers/pluggy.ts'
import queueRouters from './routers/queue.ts'
import savedPromptsRouter from './routers/savedPrompts.ts'
import * as SchedulerManager from './scheduller/SchedulerManager.ts'

Logger.info('Main', 'Preparing server... Building Tailwind CSS')
await Bun.$`DEBUG=false bunx tailwindcss -i src/tailwind.css -o public/css/tailwind.css --minify`
Logger.info('Main', 'Tailwind CSS built')

Logger.info('Main', 'Preparing server... Starting HLS managers')
await Cameras.getInstance().initAll()
Logger.info('Main', 'HLS managers started')
Logger.info('Main', 'Server ready to start')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(authenticationRouter)
app.use(googleOauthRouter)
app.use(mcpRouter)
app.use(queueRouters)
app.use(cameraRouter)
app.use(savedPromptsRouter)
app.use(pluggyRouter)

// Servir arquivos estáticos para vídeo HLS
app.use('/video', express.static(path.join(process.cwd(), 'public', 'video')))

// Sempre por último: rotas de frontend
app.use(frontendRouter)

const port = Bun.env.PORT

if (!port) {
  throw new Error('PORT not set')
}

Logger.info('Main', 'Starting server...')
const server = app.listen(port, async () => {
  Logger.info('Main', `API is running on port ${port}`)
  if (Bun.env.ENABLE_DISCORD === 'true') {
    await DiscordBot.getInstance().connect()
  }
  await SchedulerManager.StartScheduller()
})

process.on('SIGINT', async () => {
  Logger.info('Main', 'Shutting down server...')
  await DiscordBot.getInstance().disconnect()
  await SchedulerManager.StopScheduller()
  await (await MCPSSEClientSingleton.getInstance()).client.close()
  await Cameras.getInstance().stopAll()
  Logger.info('Main', 'Server shut down')
  server.close()
  process.exit(0)
})
