import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MySensorsRouter } from '../../../../clients/homeAssistant/MySensors/Router.ts'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool.ts'

const args = {
  action: z
    .enum(['enable', 'disable'])
    .describe('Action to perform on router data fetching - enable or disable')
} as const

type Args = typeof args

export class ToggleDataFetchingTool extends AbstractTool<Args> {
  name = 'toggle-router-data-fetching'
  description = 'Enables or disables router data fetching on the TP-Link router'
  args = args

  execute: ToolCallback<Args> = async args => {
    const router = new MySensorsRouter()

    if (args.action === 'enable') {
      await router.enableDataFetching()
    } else {
      await router.disableDataFetching()
    }

    return {
      content: [
        {
          type: 'text',
          text: `Router data fetching has been ${args.action}d successfully.`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = (_error, args) => {
    return {
      content: [
        {
          type: 'text',
          text: `An error occurred while trying to ${args.action} router data fetching.`
        }
      ]
    }
  }
}
