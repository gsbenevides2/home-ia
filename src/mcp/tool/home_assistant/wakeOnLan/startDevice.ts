import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { WakeOnLan } from '../../../../clients/homeAssistant/MySensors/WakeOnLan'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  device: z.enum(WakeOnLan.devices).describe('The device to wake up')
} as const

type Args = typeof args

export class StartDeviceTool extends AbstractTool<Args> {
  name = 'start_device'
  description = 'Start a device'
  args = args

  execute: ToolCallback<Args> = async args => {
    await WakeOnLan.wakeUp(args.device)
    return {
      content: [
        {
          type: 'text',
          text: `Device ${args.device} started`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = (_error, args) => {
    return {
      content: [
        {
          type: 'text',
          text: `Error starting device ${args.device}`
        }
      ]
    }
  }
}
