import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Logger } from '../../../logger'
import { Scheduller } from '../../../scheduller'
import { MCPServerTracerID } from '../../server'
import { AbstractTool } from '../AbstractTool'

const args = {} as const

type Args = typeof args

export class ListJobTool extends AbstractTool<Args> {
  name = 'list-job'
  description = 'List all jobs created with the create-job tool'
  args = args

  execute: ToolCallback<Args> = async () => {
    const tracerId = MCPServerTracerID.getTracerId()
    const jobs = await Scheduller.getJobs()

    Logger.info('ListJobTool', 'Listing jobs', { jobs }, tracerId)
    return {
      content: [{ type: 'text', text: `Jobs: ${JSON.stringify(jobs)}` }]
    }
  }
}
