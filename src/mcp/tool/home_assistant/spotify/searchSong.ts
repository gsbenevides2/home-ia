import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SpotifyAPIWrapper } from '../../../../clients/spotify'
import { AbstractTool } from '../../AbstractTool'

const args = {
  query: z.string().describe('The query to search for a song')
}

type Args = typeof args

export class SearchSong extends AbstractTool<Args> {
  name = 'search-song'
  description =
    'Search for a song on Spotify and return the name, artist, album and uri'
  args = args

  execute: ToolCallback<Args> = async args => {
    const songs = await SpotifyAPIWrapper.search(args.query)
    if (songs.length === 0) {
      return {
        content: [{ type: 'text', text: 'No songs found' }]
      }
    }
    return {
      content: songs.map(song => ({
        type: 'text',
        text: `Name: ${song.name}\nArtist: ${song.artists[0].name}\nAlbum: ${song.album.name}\nURI: ${song.uri}`
      }))
    }
  }
}
