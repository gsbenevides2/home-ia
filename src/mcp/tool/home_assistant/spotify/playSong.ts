import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Spotify } from '../../../../clients/homeAssistant/MySensors/Spotify'
import { AbstractTool } from '../../AbstractTool'

const args = {
  account: z.enum(Spotify.accounts).describe('The account to play the song on'),
  uri: z.string().describe('The uri of the song to play')
}

type Args = typeof args

export class PlaySong extends AbstractTool<Args> {
  name = 'play-song'
  description = 'Play a song on Spotify'
  args = args

  execute: ToolCallback<Args> = async args => {
    await Spotify.playSong(args.account, args.uri)
    return {
      content: [{ type: 'text', text: 'Song played' }]
    }
  }
}
