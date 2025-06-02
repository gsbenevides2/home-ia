import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Spotify } from '../../../../clients/homeAssistant/MySensors/Spotify'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  account: z
    .enum(Spotify.accounts)
    .describe('The account to play the artist on'),
  uri: z.string().describe('The uri of the artist to play')
}

type Args = typeof args

export class PlayArtist extends AbstractTool<Args> {
  name = 'play-artist'
  description = 'Play songs from an artist on Spotify'
  args = args

  execute: ToolCallback<Args> = async args => {
    await Spotify.playArtist(args.account, args.uri)
    return {
      content: [{ type: 'text', text: 'Artist played' }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        { type: 'text', text: 'An error occurred while playing the artist' }
      ]
    }
  }
}
