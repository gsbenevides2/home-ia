import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { AiScheduller } from '../../../scheduller/AiScheduler'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {
  jobId: z
    .string()
    .describe(
      'The id of the job to delete use the list-job tool to get the job id'
    )
}

type Args = typeof args

export class DeleteJobTool extends AbstractTool<Args> {
  name = 'delete-job'
  description = 'Delete a job'
  args = args

  execute: ToolCallback<Args> = async args => {
    const { jobId } = args
    await AiScheduller.deleteJob(jobId)
    return {
      content: [{ type: 'text', text: `Job ${jobId} deleted` }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error deleting job' }]
    }
  }
}
