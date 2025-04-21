import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {} as const

type Args = typeof args

export class CurrentTimeTool extends AbstractTool<Args> {
  name = 'current-time'
  description =
    'Get the current time to be used in cron jobs to run at a specific time or date returning the current time in ISO 8601 format'
  args = args

  execute: ToolCallback<Args> = async () => {
    return {
      content: [{ type: 'text', text: new Date().toISOString() }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error getting current time' }]
    }
  }
}
