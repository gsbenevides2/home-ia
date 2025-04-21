import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Logger } from '../../../logger'
import { Scheduller } from '../../../scheduller'
import { MCPServerTracerID } from '../../server'
import { AbstractTool } from '../AbstractTool'

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
    const tracerId = MCPServerTracerID.getTracerId()
    Logger.info('DeleteJobTool', 'Deleting job', { jobId }, tracerId)
    await Scheduller.deleteJob(jobId)
    return {
      content: [{ type: 'text', text: `Job ${jobId} deleted` }]
    }
  }
}
