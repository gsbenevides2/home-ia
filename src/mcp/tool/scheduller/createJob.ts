import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { AiScheduller } from '../../../scheduller/AiScheduler'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'
const args = {
  type: z
    .enum(['cron', 'date'])
    .describe(
      'The type of the job. Use cron to schedule a job to run at a specific time pattern based on crontab syntax. Use date to schedule a job to run at a specific date and time, to time input format is ISO 8601'
    ),
  time: z
    .string()
    .describe(
      'The time of the job. Use cron syntax for cron jobs or yyyy-mm-dd hh:mm:ss for date jobs'
    ),
  llm: z
    .string()
    .describe(
      'The imperative prompt that will be used when executing the task by LLM. Ex: See status of x and do y. Send message x to y etc.'
    ),
  exclude: z
    .boolean()
    .describe(
      'If true, the task will be deleted after its execution, use when you want to schedule something for only x time from now but without repetition.'
    )
}

type Args = typeof args

export class CreateJobTool extends AbstractTool<Args> {
  name = 'create-job'
  description =
    'Create a new task to be executed by LLM. Useful for scheduling tasks for the future. Or for executing repeating tasks at specific time intervals.'
  args = args

  execute: ToolCallback<Args> = async args => {
    const { type, time, llm, exclude } = args

    const jobId = await AiScheduller.scheduleJob({
      type,
      time,
      llm,
      exclude
    })

    return {
      content: [
        {
          type: 'text',
          text: `Job created with id ${jobId} and will be executed at ${time}`
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
