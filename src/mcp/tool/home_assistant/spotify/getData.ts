import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MediaPlayerStates } from '../../../../clients/homeAssistant/AbstractEntities/MediaPlayer'
import { Spotify } from '../../../../clients/homeAssistant/MySensors/Spotify'
import { Logger } from '../../../../logger'
import { MCPServerTracerID } from '../../../server'
import { AbstractTool } from '../../AbstractTool'

const args = {
  account: z.enum(Spotify.accounts).describe('The account to get data from')
} as const

type Args = typeof args

export class GetSpotifyData extends AbstractTool<Args> {
  name = 'get-spotify-data'
  description =
    'Get the current player state, volume, shuffle, repeat, and source from a Spotify account'
  args = args

  execute: ToolCallback<Args> = async args => {
    Logger.info(
      'MCP Server - GetSpotifyData',
      'Getting Spotify data',
      args,
      MCPServerTracerID.getTracerId()
    )
    const sensor = Spotify.getSensor(args.account)
    const data = await sensor.getData()
    console.log(data)
    Logger.info(
      'MCP Server - GetSpotifyData',
      'Getting Spotify data',
      data,
      MCPServerTracerID.getTracerId()
    )
    const content: { type: 'text'; text: string }[] = [
      {
        type: 'text',
        text: `Spotify ${args.account} is has a ${data.state} state`
      }
    ]

    if (
      data.state === MediaPlayerStates.PLAYING ||
      data.state === MediaPlayerStates.PAUSED
    ) {
      const attributes = data.attributes
      content.push(
        {
          type: 'text',
          text:
            data.state === MediaPlayerStates.PLAYING
              ? `Spotify ${args.account} is playing ${attributes.media_title} by ${attributes.media_artist}`
              : `Spotify ${args.account} is paused on ${attributes.media_title} by ${attributes.media_artist}`
        },
        {
          type: 'text',
          text: `Spotify ${args.account} currently track has ${attributes.media_duration} seconds of duration`
        },
        {
          type: 'text',
          text: `Spotify ${args.account} is ${attributes.shuffle ? 'shuffling' : 'not shuffling'}`
        },
        {
          type: 'text',
          text: `Spotify ${args.account} has volume ${attributes.volume_level}`
        },
        {
          type: 'text',
          text: `Spotify ${args.account} is in ${attributes.repeat} repeat mode`
        },
        {
          type: 'text',
          text: `Spotify ${args.account} is in ${attributes.source} source`
        }
      )
    }

    return {
      content
    }
  }
}
