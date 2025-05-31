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
    .describe('Maximum number of emails to return (default: 10)'),
  q: z
    .string()
    .optional()
    .describe(
      'Gmail search query (e.g., "is:unread", "from:example@email.com")'
    ),
  labelIds: z
    .array(z.string())
    .optional()
    .describe('Array of label IDs to filter by'),
  includeSpamTrash: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include spam and trash emails')
} as const

type Args = typeof args
export { type Args }

export class ListEmails extends AbstractTool<Args> {
  name = 'list-emails'
  description = 'List emails from Gmail inbox with optional filtering'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error listing emails' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const emails = await GoogleGmail.getInstance().listEmails({
      email: args.email,
      maxResults: args.maxResults,
      q: args.q,
      labelIds: args.labelIds,
      includeSpamTrash: args.includeSpamTrash
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
        const isUnread = email.labelIds?.includes('UNREAD') ? 'Yes' : 'No'

        return {
          type: 'text',
          text: `ID: ${email.id}\nFrom: ${from}\nSubject: ${subject}\nDate: ${date}\nUnread: ${isUnread}\n---`
        }
      }) as { type: 'text'; text: string }[]

      return {
        content: [
          {
            type: 'text',
            text: `Found ${emails.length} emails:`
          },
          ...content
        ]
      }
    } else {
      return {
        content: [{ type: 'text', text: 'No emails found' }]
      }
    }
  }
}
