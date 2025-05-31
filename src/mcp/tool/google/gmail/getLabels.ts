import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleGmail } from '../../../../clients/google/Gmail'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z.string().email().describe('The email address of the account')
} as const

type Args = typeof args
export { type Args }

export class GetLabels extends AbstractTool<Args> {
  name = 'get-gmail-labels'
  description = 'Get all available labels in Gmail'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error getting Gmail labels' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const labels = await GoogleGmail.getInstance().getLabels({
      email: args.email
    })

    if (labels && labels.length > 0) {
      const content = labels.map(label => ({
        type: 'text',
        text: `ID: ${label.id}\nName: ${label.name}\nType: ${label.type}\nVisible: ${label.labelListVisibility || 'unknown'}\n---`
      })) as { type: 'text'; text: string }[]

      return {
        content: [
          {
            type: 'text',
            text: `Found ${labels.length} labels:`
          },
          ...content
        ]
      }
    } else {
      return {
        content: [{ type: 'text', text: 'No labels found' }]
      }
    }
  }
}
