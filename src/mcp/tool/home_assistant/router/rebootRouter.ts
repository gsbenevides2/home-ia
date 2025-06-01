import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { MySensorsRouter } from '../../../../clients/homeAssistant/MySensors/Router.ts'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool.ts'

const args = {} as const

type Args = typeof args

export class RebootRouterTool extends AbstractTool<Args> {
  name = 'reboot-router'
  description = 'Reboots the TP-Link router'
  args = args

  execute: ToolCallback<Args> = async () => {
    const router = new MySensorsRouter()
    await router.reboot()

    return {
      content: [
        {
          type: 'text',
          text: 'Router reboot has been initiated successfully. The router will be offline for a few minutes while it restarts.'
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while trying to reboot the router.'
        }
      ]
    }
  }
}
