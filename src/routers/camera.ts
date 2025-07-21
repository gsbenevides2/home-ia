import { Elysia, file } from 'elysia'
import fs from 'fs/promises'
import path from 'path'
import { Cameras, type CameraName } from '../clients/Camera/CamerasSingleton'
import { Logger } from '../logger'
import { authService } from './authentication'

const app = new Elysia({
  prefix: '/cameras-service'
})
  .use(authService)
  .get(
    '/:cameraName/snapshot.jpg',
    async context => {
      Logger.info('Camera', 'Getting snapshot')
      const cameraName = context.params.cameraName
      Logger.info('Camera', 'Camera name', cameraName)
      const camera = await Cameras.getInstance().getCamera(
        cameraName as CameraName
      )
      if (!camera) {
        Logger.error('Camera', 'Camera not found', cameraName)
        return context.status(404, 'Not Found')
      }
      const snapshotUrl = camera.getSnapshotUrl()
      Logger.info('Camera', 'Snapshot URL', snapshotUrl)
      const response = await fetch(snapshotUrl)
      if (!response.ok) {
        Logger.error('Camera', 'Failed to fetch snapshot', snapshotUrl)
        return context.status(500, 'Internal Server Error')
      }
      Logger.info('Camera', 'Snapshot fetched successfully')
      const buffer = await response.arrayBuffer()
      Logger.info('Camera', 'Buffer fetched successfully')
      const data = Buffer.from(buffer)

      const tempDir = path.dirname(process.cwd(), 'temp')
      if (!(await fs.exists(tempDir))) {
        await fs.mkdir(tempDir, { recursive: true })
      }

      const tempFile = path.join(tempDir, 'snapshot.jpg')
      await fs.writeFile(tempFile, data)
      return file(tempFile)
    },
    {
      requireAuthentication: true
    }
  )
  .get(
    '/:cameraName/playlist.m3u8',
    async context => {
      try {
        const cameraName = context.params.cameraName
        const camera = await Cameras.getInstance().getCamera(
          cameraName as CameraName
        )
        if (!camera) {
          return context.status(404, 'Not Found')
        }
        const hlsManager = camera.hlsStream

        if (!hlsManager.isRunning()) {
          setTimeout(async () => {
            if (await fs.exists(hlsManager.playlistPath)) {
              context.set.headers['content-type'] =
                'application/vnd.apple.mpegurl'
              context.set.headers['cache-control'] =
                'no-cache, no-store, must-revalidate'
              context.set.headers['pragma'] = 'no-cache'
              context.set.headers['expires'] = '0'
              return new Response(await fs.readFile(hlsManager.playlistPath), {
                headers: context.set.headers as HeadersInit
              })
            }
          }, 2000)
        } else {
          if (await fs.exists(hlsManager.playlistPath)) {
            context.set.headers['content-type'] =
              'application/vnd.apple.mpegurl'
            context.set.headers['cache-control'] =
              'no-cache, no-store, must-revalidate'
            context.set.headers['pragma'] = 'no-cache'
            context.set.headers['expires'] = '0'
            return new Response(await fs.readFile(hlsManager.playlistPath), {
              headers: context.set.headers as HeadersInit
            })
          }
        }
      } catch {
        context.status(500, 'Internal Server Error')
      }
    },
    {
      requireAuthentication: true
    }
  )
  .get(
    '/:cameraName/:filename',
    async context => {
      console.log('get /:cameraName/:filename', context.params)
      try {
        const cameraName = context.params.cameraName
        const camera = await Cameras.getInstance().getCamera(
          cameraName as CameraName
        )
        if (!camera) {
          return context.status(404, 'Camera not found')
        }
        const hlsManager = camera.hlsStream
        const filename = context.params.filename
        if (!filename.endsWith('.ts') && !filename.endsWith('.m3u8')) {
          return context.status(403, 'Acesso negado')
        }

        const filePath = path.join(hlsManager.hlsDir, filename)

        if (await fs.exists(filePath)) {
          context.set.headers['cache-control'] =
            'no-cache, no-store, must-revalidate'
          context.set.headers['pragma'] = 'no-cache'
          context.set.headers['expires'] = '0'
          return new Response(await fs.readFile(filePath), {
            headers: context.set.headers as HeadersInit
          })
        } else {
          return context.status(404, 'Arquivo não encontrado')
        }
      } catch (error) {
        console.error('Error getting /:cameraName/:filename', error)
        return context.status(500, 'Erro interno')
      }
    },
    {
      requireAuthentication: true
    }
  )
  .post(
    '/:cameraName/up',
    async context => {
      const cameraName = context.params.cameraName
      const camera = await Cameras.getInstance().getCamera(
        cameraName as CameraName
      )
      if (!camera) {
        return context.status(404, 'Camera not found')
      }
      await camera.up()
      return context.status(200, 'Camera moved up')
    },
    {
      requireAuthentication: true
    }
  )
  .post(
    '/:cameraName/down',
    async context => {
      const cameraName = context.params.cameraName
      const camera = await Cameras.getInstance().getCamera(
        cameraName as CameraName
      )
      if (!camera) {
        return context.status(404, 'Camera not found')
      }
      await camera.down()
      return context.status(200, 'Camera moved down')
    },
    {
      requireAuthentication: true
    }
  )
  .post(
    '/:cameraName/left',
    async context => {
      const cameraName = context.params.cameraName
      const camera = await Cameras.getInstance().getCamera(
        cameraName as CameraName
      )
      if (!camera) {
        return context.status(404, 'Camera not found')
      }
      await camera.left()
      return context.status(200, 'Camera moved left')
    },
    {
      requireAuthentication: true
    }
  )
  .post(
    '/:cameraName/right',
    async context => {
      const cameraName = context.params.cameraName
      const camera = await Cameras.getInstance().getCamera(
        cameraName as CameraName
      )
      if (!camera) {
        return context.status(404, 'Camera not found')
      }
      await camera.right()
      return context.status(200, 'Camera moved right')
    },
    {
      requireAuthentication: true
    }
  )

export default app
