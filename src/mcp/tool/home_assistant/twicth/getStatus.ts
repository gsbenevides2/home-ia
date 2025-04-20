import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Twitch } from '../../../../clients/homeAssistant/MySensors/Twitch'
import { Logger } from '../../../../logger'
import { MCPServerTracerID } from '../../../server'
import { AbstractTool } from '../../AbstractTool'

const args = {
  streamerId: z
    .string()
    .describe(
      'The ID of the streamer to get the status of in Twitch, you can get the IDs with the get-streamer-ids tool'
    )
} as const

type Args = typeof args

export class GetStreamerStatusTool extends AbstractTool<Args> {
  name = 'get-streamer-status'
  description = 'Get the status of a streamer'
  args = args

  execute: ToolCallback<Args> = async args => {
    Logger.info(
      'MCP Server - GetStreamerStatusTool',
      'Getting streamer status',
      args,
      MCPServerTracerID.getTracerId()
    )
    const status = await Twitch.getStreamerStatus(args.streamerId)
    return {
      content: [
        {
          type: 'text',
          text: `The streamer ${status.attributes.friendly_name} is ${status.status}`
        },
        {
          type: 'text',
          text: `You are following this streamer: ${status.attributes.following}`
        },
        {
          type: 'text',
          text: `You are subscribed to this streamer: ${status.attributes.subscribed}`
        },
        {
          type: 'text',
          text: `If you are subscribed to this streamer, you are subscribed to the ${status.attributes.subscription_tier} tier`
        },
        {
          type: 'text',
          text: `This streamer has ${status.attributes.followers} followers`
        },
        {
          type: 'text',
          text: `If this streamer is streaming, the game is ${status.attributes.game}`
        },
        {
          type: 'text',
          text: `If this streamer is streaming, the title is ${status.attributes.title}`
        },
        {
          type: 'text',
          text: `If this streamer is streaming, the started at is ${status.attributes.started_at}`
        },
        {
          type: 'text',
          text: `If this streamer is streaming, the viewers are ${status.attributes.viewers}`
        },
        {
          type: 'text',
          text: `You are following this streamer since ${status.attributes.following_since}`
        }
      ]
    }
  }
}
