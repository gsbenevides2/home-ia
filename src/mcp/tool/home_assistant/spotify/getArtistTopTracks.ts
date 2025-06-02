import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SpotifyAPIWrapper } from '../../../../clients/spotify'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  artistId: z
    .string()
    .describe('The Spotify ID of the artist to get top tracks from')
}

type Args = typeof args

export class GetArtistTopTracks extends AbstractTool<Args> {
  name = 'get-artist-top-tracks'
  description =
    'Get the top tracks (most popular songs) from a specific artist on Spotify using their artist ID'
  args = args

  execute: ToolCallback<Args> = async args => {
    const tracks = await SpotifyAPIWrapper.getArtistTopTracks(args.artistId)

    if (tracks.length === 0) {
      return {
        content: [{ type: 'text', text: 'No top tracks found for this artist' }]
      }
    }
    return {
      content: tracks.map((track, index) => ({
        type: 'text',
        text: `${index + 1}. Name: ${track.name}\nAlbum: ${track.album.name}\nPopularity: ${track.popularity}\nDuration: ${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}\nURI: ${track.uri}`
      }))
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while getting artist top tracks'
        }
      ]
    }
  }
}
