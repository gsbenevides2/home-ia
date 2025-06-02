import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Spotify } from '../../../../clients/homeAssistant/MySensors/Spotify'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  account: z
    .enum(Spotify.accounts)
    .describe('The account to play the album on'),
  uri: z.string().describe('The uri of the album to play')
}

type Args = typeof args

export class PlayAlbum extends AbstractTool<Args> {
  name = 'play-album'
  description = 'Play an album on Spotify'
  args = args

  execute: ToolCallback<Args> = async args => {
    await Spotify.playAlbum(args.account, args.uri)
    return {
      content: [{ type: 'text', text: 'Album played' }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        { type: 'text', text: 'An error occurred while playing the album' }
      ]
    }
  }
}
