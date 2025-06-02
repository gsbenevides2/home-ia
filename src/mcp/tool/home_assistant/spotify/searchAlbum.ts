import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SpotifyAPIWrapper } from '../../../../clients/spotify'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  query: z.string().describe('The query to search for an album')
}

type Args = typeof args

export class SearchAlbum extends AbstractTool<Args> {
  name = 'search-album'
  description =
    'Search for an album on Spotify and return the name, artist, release date, total tracks and uri'
  args = args

  execute: ToolCallback<Args> = async args => {
    const albums = await SpotifyAPIWrapper.searchAlbum(args.query)

    if (albums.length === 0) {
      return {
        content: [{ type: 'text', text: 'No albums found' }]
      }
    }
    return {
      content: albums.map(album => ({
        type: 'text',
        text: `Name: ${album.name}\nArtist: ${album.artists[0].name}\nRelease Date: ${album.release_date}\nTotal Tracks: ${album.total_tracks}\nType: ${album.album_type}\nURI: ${album.uri}`
      }))
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        { type: 'text', text: 'An error occurred while searching for an album' }
      ]
    }
  }
}
