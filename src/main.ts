import { Cameras } from './clients/Camera/CamerasSingleton'
import { DiscordBot } from './discord/index.ts'
import { Logger } from './logger/index.ts'
import { MCPSSEClientSingleton } from './mcp/client/sse.ts'
import app from './routers'
import * as SchedulerManager from './scheduller/SchedulerManager.ts'

Logger.info('Main', 'Preparing server... Starting HLS managers')
await Cameras.getInstance().initAll()
Logger.info('Main', 'HLS managers started')

const port = Bun.env.PORT

if (!port) {
  throw new Error('PORT not set')
}

app.listen(port, async () => {
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
  await app.server?.stop()
  process.exit(0)
})
