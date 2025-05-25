import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { prepareImageToSendToAnthropic } from '../../../clients/Anthropic/prepareImageToSendToAnthropic'
import { Cameras } from '../../../clients/Camera/CamerasSingleton'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {
  cameraName: z
    .enum(Cameras.getInstance().getAvailableCameras())
    .describe('The name of the camera to take a snapshot of')
} as const

export type Args = typeof args

export class SnapshotTool extends AbstractTool<Args> {
  name = 'snapshot'
  description = 'Take a snapshot of a camera'
  args = args

  execute: ToolCallback<Args> = async args => {
    const camera = await Cameras.getInstance().getCamera(args.cameraName)
    if (!camera) {
      return {
        content: [{ type: 'text', text: 'Camera not found' }]
      }
    }
    const snapshotUrl = camera.getSnapshotUrl()
    const imagePrepared = await prepareImageToSendToAnthropic(snapshotUrl)
    return {
      content: [
        {
          type: 'image',
          data: imagePrepared.data.toString('base64'),
          mimeType: imagePrepared.mimeType
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = error => {
    console.error('Error in snapshot tool:', error)
    return {
      content: [{ type: 'text', text: 'Error in snapshot tool' }]
    }
  }
}
