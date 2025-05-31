import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleGmail } from '../../../../clients/google/Gmail'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z.string().email().describe('The email address of the account'),
  messageIds: z
    .array(z.string())
    .describe('Array of message IDs to mark as read')
} as const

type Args = typeof args
export { type Args }

export class MarkAsRead extends AbstractTool<Args> {
  name = 'mark-emails-as-read'
  description = 'Mark one or more emails as read in Gmail'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error marking emails as read' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    await GoogleGmail.getInstance().markAsRead({
      email: args.email,
      messageIds: args.messageIds
    })

    return {
      content: [
        {
          type: 'text',
          text: `Successfully marked ${args.messageIds.length} email(s) as read`
        }
      ]
    }
  }
}
