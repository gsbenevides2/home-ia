import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleGmail } from '../../../../clients/google/Gmail'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z.string().email().describe('The email address of the account'),
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe('Maximum number of unread emails to return (default: 10)')
} as const

type Args = typeof args
export { type Args }

export class GetUnreadEmails extends AbstractTool<Args> {
  name = 'get-unread-emails'
  description = 'Get unread emails from Gmail inbox'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error getting unread emails' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const emails = await GoogleGmail.getInstance().getUnreadEmails({
      email: args.email,
      maxResults: args.maxResults
    })

    if (emails && emails.length > 0) {
      const content = emails.map(email => {
        const headers = email.payload?.headers || []
        const from =
          headers.find(h => h.name === 'From')?.value || 'Unknown sender'
        const subject =
          headers.find(h => h.name === 'Subject')?.value || 'No subject'
        const date =
          headers.find(h => h.name === 'Date')?.value || 'Unknown date'

        return {
          type: 'text',
          text: `ID: ${email.id}\nFrom: ${from}\nSubject: ${subject}\nDate: ${date}\n---`
        }
      }) as { type: 'text'; text: string }[]

      return {
        content: [
          {
            type: 'text',
            text: `Found ${emails.length} unread emails:`
          },
          ...content
        ]
      }
    } else {
      return {
        content: [{ type: 'text', text: 'No unread emails found' }]
      }
    }
  }
}
