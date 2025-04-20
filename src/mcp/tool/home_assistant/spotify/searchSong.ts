import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SpotifyAPIWrapper } from '../../../../clients/spotify'
import { Logger } from '../../../../logger'
import { MCPServerTracerID } from '../../../server'
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
    console.log('Searching for a song on Spotify', args)
    Logger.info(
      'MCP Server - SearchSong',
      'Searching for a song on Spotify',
      args,
      MCPServerTracerID.getTracerId()
    )
    const songs = await SpotifyAPIWrapper.search(args.query)
    Logger.info(
      'MCP Server - SearchSong',
      'Songs found',
      songs.map(song => ({
        name: song.name,
        artist: song.artists[0].name,
        album: song.album.name,
        uri: song.uri
      })),
      MCPServerTracerID.getTracerId()
    )
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
