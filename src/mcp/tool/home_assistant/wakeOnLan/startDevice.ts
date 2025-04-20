import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { WakeOnLan } from '../../../../clients/homeAssistant/MySensors/WakeOnLan'
import { Logger } from '../../../../logger'
import { MCPServerTracerID } from '../../../server'
import { AbstractTool } from '../../AbstractTool'

const args = {
  device: z.enum(WakeOnLan.devices).describe('The device to wake up')
} as const

type Args = typeof args

export class StartDeviceTool extends AbstractTool<Args> {
  name = 'start_device'
  description = 'Start a device'
  args = args

  execute: ToolCallback<Args> = async args => {
    Logger.info(
      'MCP Server - StartDeviceTool',
      'Starting device',
      args,
      MCPServerTracerID.getTracerId()
    )
    try {
      await WakeOnLan.wakeUp(args.device)
      return {
        content: [
          {
            type: 'text',
            text: `Device ${args.device} started`
          }
        ]
      }
    } catch (error) {
      Logger.error(
        'MCP Server - StartDeviceTool',
        'Error starting device',
        error
      )
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
}
