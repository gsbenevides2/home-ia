import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleGmail } from '../../../../clients/google/Gmail'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z.string().email().describe('The email address of the account'),
  messageId: z.string().describe('The ID of the message to retrieve'),
  format: z
    .enum(['minimal', 'full', 'raw', 'metadata'])
    .optional()
    .default('full')
    .describe('The format of the message (default: full)')
} as const

type Args = typeof args
export { type Args }

export class GetEmailById extends AbstractTool<Args> {
  name = 'get-email-by-id'
  description = 'Get detailed email content by message ID from Gmail'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error getting email details' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const email = await GoogleGmail.getInstance().getEmailById({
      email: args.email,
      messageId: args.messageId,
      format: args.format
    })

    if (email) {
      const headers = email.payload?.headers || []
      const from =
        headers.find(h => h.name === 'From')?.value || 'Unknown sender'
      const to =
        headers.find(h => h.name === 'To')?.value || 'Unknown recipient'
      const subject =
        headers.find(h => h.name === 'Subject')?.value || 'No subject'
      const date = headers.find(h => h.name === 'Date')?.value || 'Unknown date'
      const isUnread = email.labelIds?.includes('UNREAD') ? 'Yes' : 'No'

      // Extract body content
      let body = 'No body content available'
      if (email.payload?.body?.data) {
        body = Buffer.from(email.payload.body.data, 'base64').toString('utf-8')
      } else if (email.payload?.parts) {
        // Look for text/plain or text/html parts
        const textPart = email.payload.parts.find(
          part =>
            part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        )
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Email Details:
ID: ${email.id}
From: ${from}
To: ${to}
Subject: ${subject}
Date: ${date}
Unread: ${isUnread}
Thread ID: ${email.threadId}

Body:
${body}`
          }
        ]
      }
    } else {
      return {
        content: [{ type: 'text', text: 'Email not found' }]
      }
    }
  }
}
