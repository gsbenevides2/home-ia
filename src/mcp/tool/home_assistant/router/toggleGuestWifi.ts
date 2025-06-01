import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MySensorsRouter } from '../../../../clients/homeAssistant/MySensors/Router.ts'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool.ts'

const args = {
  action: z
    .enum(['enable', 'disable'])
    .describe('Action to perform on guest WiFi - enable or disable')
} as const

type Args = typeof args

export class ToggleGuestWifiTool extends AbstractTool<Args> {
  name = 'toggle-guest-wifi'
  description = 'Enables or disables the guest WiFi on the TP-Link router'
  args = args

  execute: ToolCallback<Args> = async args => {
    const router = new MySensorsRouter()

    if (args.action === 'enable') {
      await router.enableGuestWifi()
    } else {
      await router.disableGuestWifi()
    }

    return {
      content: [
        {
          type: 'text',
          text: `Guest WiFi has been ${args.action}d successfully.`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = (_error, args) => {
    return {
      content: [
        {
          type: 'text',
          text: `An error occurred while trying to ${args.action} guest WiFi.`
        }
      ]
    }
  }
}
