import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleGmail } from '../../../../clients/google/Gmail'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z.string().email().describe('The email address of the account'),
  query: z
    .string()
    .describe(
      'Gmail search query (e.g., "from:example@email.com", "subject:important", "has:attachment")'
    ),
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe('Maximum number of emails to return (default: 10)')
} as const

type Args = typeof args
export { type Args }

export class SearchEmails extends AbstractTool<Args> {
  name = 'search-emails'
  description = 'Search emails in Gmail using Gmail search syntax'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error searching emails' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const emails = await GoogleGmail.getInstance().searchEmails({
      email: args.email,
      query: args.query,
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
            text: `Found ${emails.length} emails matching "${args.query}":`
          },
          ...content
        ]
      }
    } else {
      return {
        content: [
          { type: 'text', text: `No emails found matching "${args.query}"` }
        ]
      }
    }
  }
}
