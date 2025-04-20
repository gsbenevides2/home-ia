import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Spotify } from '../../../../clients/homeAssistant/MySensors/Spotify'
import { AbstractTool } from '../../AbstractTool'

const operations = ['play', 'pause', 'next', 'previous', 'setVolume'] as const
const operationsResult = {
  play: 'Spotify has been played',
  pause: 'Spotify has been paused',
  next: 'Spotify has been skipped to the next song',
  previous: 'Spotify has been skipped to the previous song',
  setVolume: 'Spotify has been set to the volume'
} as const

const args = {
  account: z
    .enum(Spotify.accounts)
    .describe('The account to make operation on'),
  operation: z.enum(operations).describe('The operation to make on Spotify'),
  volume: z
    .number()
    .min(0)
    .max(1)
    .describe('The volume to set on Spotify (0-100)')
    .optional()
} as const

type Args = typeof args

export class MakeSpotifyOperation extends AbstractTool<Args> {
  name = 'make-spotify-operation'
  description = 'Make an operation on Spotify'
  args = args

  execute: ToolCallback<Args> = async args => {
    const sensor = Spotify.getSensor(args.account)
    if (args.operation === 'play') {
      await sensor.play()
    } else if (args.operation === 'pause') {
      await sensor.pause()
    } else if (args.operation === 'next') {
      await sensor.next()
    } else if (args.operation === 'previous') {
      await sensor.previous()
    } else if (args.operation === 'setVolume') {
      await sensor.setVolume(args.volume ?? 0)
    }
    const content: { type: 'text'; text: string }[] = [
      {
        type: 'text',
        text: `${operationsResult[args.operation]}`
      }
    ]
    return { content }
  }
}
