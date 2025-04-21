import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Twitch } from '../../../../clients/homeAssistant/MySensors/Twitch'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {} as const

type Args = typeof args

export class GetStreamerIdsTool extends AbstractTool<Args> {
  name = 'get-streamer-ids'
  description = 'Get the IDs of all streamers in Twitch'
  args = args

  execute: ToolCallback<Args> = async () => {
    const streamers = await Twitch.getStreamers()
    return {
      content: streamers.map(streamer => ({
        type: 'text',
        text: `The Streamer ${streamer.friendly_name} has the ID ${streamer.id}`
      }))
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while getting the streamer IDs'
        }
      ]
    }
  }
}
