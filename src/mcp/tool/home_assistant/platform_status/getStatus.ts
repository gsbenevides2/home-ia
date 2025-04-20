import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { StatusSensors } from '../../../../clients/homeAssistant/MySensors/StatusSensors'
import { Logger } from '../../../../logger'
import { MCPServerTracerID } from '../../../server'
import { AbstractTool } from '../../AbstractTool'

const args = {
  plataform_id: z
    .string()
    .describe(
      'The ID of the platform to get the status of, you can get the IDs with the get-platform-ids tool'
    )
} as const

type Args = typeof args

export class GetPlatformStatusTool extends AbstractTool<Args> {
  name = 'get-platform-status'
  description = 'Get the status of a platform'
  args = args

  execute: ToolCallback<Args> = async args => {
    Logger.info(
      'MCP Server - GetPlatformStatusTool',
      'Getting platform status',
      args,
      MCPServerTracerID.getTracerId()
    )
    const status = await StatusSensors.getInstance().getStatus(
      args.plataform_id
    )
    return {
      content: [
        {
          type: 'text',
          text: `The status of the platform ${args.plataform_id} is ${status}`
        }
      ]
    }
  }
}
