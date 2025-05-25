import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleTextToSpeach } from '../../../clients/google/GoogleTextToSpeach'
import { WhatsAppClient } from '../../../clients/WhatsApp'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {
  to: z
    .number()
    .describe(
      'The phone number in format 5511972839087 to send the message to'
    ),
  message: z.string().describe('The message to send')
}

export class SendWhatsAppAudioMessageTool extends AbstractTool<typeof args> {
  name = 'send-whatsapp-audio-message'
  description = 'Send a audio message to a WhatsApp number'
  args = args

  execute: ToolCallback<typeof args> = async args => {
    const audio = await GoogleTextToSpeach.getInstance().textToSpeach(
      args.message
    )
    await WhatsAppClient.getInstance().sendAudio(args.to, audio)
    return {
      content: [{ type: 'text', text: 'Message sent successfully' }]
    }
  }

  onError: OnErrorToolCallback<typeof args> = () => {
    return {
      content: [{ type: 'text', text: 'Error sending message' }]
    }
  }
}
