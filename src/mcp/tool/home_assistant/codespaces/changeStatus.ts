import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Logger } from '../../../../logger/index.ts'
import { addToQueue } from '../../../../queue/queue.ts'
import { MCPServerTracerID } from '../../../server.ts'
import { AbstractTool } from '../../AbstractTool.ts'

const args = {
  status: z
    .enum(['start', 'stop'])
    .describe('The desired action to perform on the workspace (start/stop)')
} as const

type Args = typeof args

export class ChangeCodespacesStatusTool extends AbstractTool<Args> {
  name = 'control-the-codespaces-machine'
  description =
    'Control the Google Cloud virtual machine on Conpute Engine called Codespaces to start or stop it'
  args = args

  execute: ToolCallback<Args> = async args => {
    const status = args.status
    Logger.info(
      'MCP Server - ChangeCodespacesStatusTool',
      'Changing codespaces status',
      status,
      MCPServerTracerID.getTracerId()
    )
    addToQueue(status === 'start' ? 'codespaces-start' : 'codespaces-stop')
    return {
      content: [
        {
          type: 'text',
          text: `The codespaces machine is being ${status === 'start' ? 'starting' : 'stopping'}`
        }
      ]
    }
  }
}
