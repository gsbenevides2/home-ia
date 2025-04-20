import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Pihole } from '../../../../clients/homeAssistant/MySensors/Pihole.ts'
import { Logger } from '../../../../logger/index.ts'
import { MCPServerTracerID } from '../../../server.ts'
import { AbstractTool } from '../../AbstractTool.ts'

const args = {} as const

type Args = typeof args

export class GetPiholeStatusTool extends AbstractTool<Args> {
  name = 'get-pihole-status'
  description =
    'Retrieve the status of whether or not PiHole is blocking domains that contain ads.'
  args = args

  execute: ToolCallback<Args> = async args => {
    Logger.info(
      'MCP Server - GetPiholeStatusTool',
      'Getting pihole status',
      args,
      MCPServerTracerID.getTracerId()
    )
    try {
      const piholeStatus = await Pihole.getStatus()
      Logger.info(
        'MCP Server - GetPiholeStatusTool',
        'Pihole status retrieved',
        piholeStatus,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: `The pihole is ${piholeStatus}`
          }
        ]
      }
    } catch (error) {
      Logger.error(
        'MCP Server - GetPiholeStatusTool',
        'Error getting pihole status',
        error,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: `An error occurred while getting the pihole status.`
          }
        ]
      }
    }
  }
}
