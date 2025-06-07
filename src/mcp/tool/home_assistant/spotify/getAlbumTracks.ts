import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SpotifyAPIWrapper } from '../../../../clients/spotify'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  albumId: z.string().describe('The Spotify ID of the album to get tracks from')
}

type Args = typeof args

export class GetAlbumTracks extends AbstractTool<Args> {
  name = 'get-album-tracks'
  description =
    'Get all tracks from a specific album on Spotify using the album ID'
  args = args

  execute: ToolCallback<Args> = async args => {
    const tracks = await SpotifyAPIWrapper.getAlbumTracks(args.albumId)

    if (tracks.length === 0) {
      return {
        content: [{ type: 'text', text: 'No tracks found in this album' }]
      }
    }

    return {
      content: tracks.map(track => ({
        type: 'text',
        text: `Name: ${track.name}\nDuration: ${Math.round(track.duration_ms / 1000)}s\nTrack Number: ${track.track_number}\nURI: ${track.uri}`
      }))
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        { type: 'text', text: 'An error occurred while getting album tracks' }
      ]
    }
  }
}
