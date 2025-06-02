import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SpotifyAPIWrapper } from '../../../../clients/spotify'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  query: z.string().describe('The query to search for an artist')
}

type Args = typeof args

export class SearchArtist extends AbstractTool<Args> {
  name = 'search-artist'
  description =
    'Search for an artist on Spotify and return the name, genres, popularity and uri'
  args = args

  execute: ToolCallback<Args> = async args => {
    const artists = await SpotifyAPIWrapper.searchArtist(args.query)

    if (artists.length === 0) {
      return {
        content: [{ type: 'text', text: 'No artists found' }]
      }
    }
    return {
      content: artists.map(artist => ({
        type: 'text',
        text: `Name: ${artist.name}\nGenres: ${artist.genres.join(', ') || 'Not specified'}\nPopularity: ${artist.popularity}\nFollowers: ${artist.followers.total}\nURI: ${artist.uri}`
      }))
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while searching for an artist'
        }
      ]
    }
  }
}
