import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SpotifyAPIWrapper } from '../../../../clients/spotify'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  artistId: z
    .string()
    .describe('The Spotify ID of the artist to get albums from')
}

type Args = typeof args

export class GetArtistAlbums extends AbstractTool<Args> {
  name = 'get-artist-albums'
  description =
    'Get all albums from a specific artist on Spotify using their artist ID'
  args = args

  execute: ToolCallback<Args> = async args => {
    const albums = await SpotifyAPIWrapper.getArtistAlbums(args.artistId)

    if (albums.length === 0) {
      return {
        content: [{ type: 'text', text: 'No albums found for this artist' }]
      }
    }
    return {
      content: albums.map(album => ({
        type: 'text',
        text: `Name: ${album.name}\nRelease Date: ${album.release_date}\nTotal Tracks: ${album.total_tracks}\nType: ${album.album_type}\nURI: ${album.uri}`
      }))
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        { type: 'text', text: 'An error occurred while getting artist albums' }
      ]
    }
  }
}
