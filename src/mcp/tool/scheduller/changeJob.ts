import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { AiScheduller } from '../../../scheduller/AiScheduler'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'
const args = {
  id: z.string().describe('The id of the job to be changed'),
  type: z
    .enum(['cron', 'date'])
    .describe(
      'The type of the job. Use cron to schedule a job to run at a specific time pattern based on crontab syntax. Use date to schedule a job to run at a specific date and time, to time input format is ISO 8601'
    )
    .optional(),
  time: z
    .string()
    .describe(
      'The time of the job. Use cron syntax for cron jobs or ISO 8601 for date jobs'
    )
    .optional(),
  llm: z
    .string()
    .describe(
      'The imperative prompt that will be used when executing the task by LLM. Ex: See status of x and do y. Send message x to y etc.'
    )
    .optional(),
  exclude: z
    .boolean()
    .describe(
      'If true, the task will be deleted after its execution, use when you want to schedule something for only x time from now but without repetition.'
    )
    .optional()
}

type Args = typeof args

export class ChangeJobTool extends AbstractTool<Args> {
  name = 'change-job'
  description =
    'Change a job to be executed by LLM. Useful for scheduling tasks for the future. Or for executing repeating tasks at specific time intervals. The id of the job is required to change it.'
  args = args

  execute: ToolCallback<Args> = async args => {
    const { id, type, time, llm, exclude } = args

    const job = await AiScheduller.changeJob(id, { type, time, llm, exclude })

    return {
      content: [
        {
          type: 'text',
          text: `Job ${job?.id} updated with type ${job?.type}, time ${job?.time}, llm ${job?.llm}, exclude ${job?.exclude}`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error creating job' }]
    }
  }
}
