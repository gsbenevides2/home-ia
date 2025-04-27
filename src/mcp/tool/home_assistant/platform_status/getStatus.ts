import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { StatusSensors } from '../../../../clients/homeAssistant/MySensors/StatusSensors'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

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
    const status = await StatusSensors.getInstance().getStatus(
      args.plataform_id
    )

    const content: { type: 'text'; text: string }[] = [
      {
        type: 'text',
        text: `The status of the platform ${args.plataform_id} is ${status.state}`
      }
    ]

    if (status.attributes.problem_description) {
      content.push({
        type: 'text',
        text: `The problem description of the platform ${args.plataform_id} is ${status.attributes.problem_description}`
      })
    }

    if (status.attributes.status_url) {
      content.push({
        type: 'text',
        text: `The status page url of the platform ${args.plataform_id} is ${status.attributes.status_url}`
      })
    }

    return {
      content: content
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while getting the platform status'
        }
      ]
    }
  }
}
