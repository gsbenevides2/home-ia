import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { EmailClient } from '../../../clients/email'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {
  to: z.string().email().describe('Sender email'),
  subject: z.string().describe('Subject of the email'),
  body: z.string().describe('Body of the email in Markdown format')
} as const

type Args = typeof args

export class SendEmailTool extends AbstractTool<Args> {
  name = 'send-email'
  description =
    'Send an email to a specific email address using Markdown format'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'Error sending email'
        }
      ],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const { to, subject, body } = args
    const emailClient = EmailClient.getInstance()
    await emailClient.sendEmail({ to, subject, body })
    return {
      content: [{ type: 'text', text: 'Email sent' }],
      isError: false
    }
  }
}
