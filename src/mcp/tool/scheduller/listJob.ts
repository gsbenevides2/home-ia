import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Scheduller } from '../../../scheduller'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {} as const

type Args = typeof args

export class ListJobTool extends AbstractTool<Args> {
  name = 'list-job'
  description = 'List all jobs created with the create-job tool'
  args = args

  execute: ToolCallback<Args> = async () => {
    const jobs = await Scheduller.getJobs()

    return {
      content: [{ type: 'text', text: `Jobs: ${JSON.stringify(jobs)}` }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error listing jobs' }]
    }
  }
}
