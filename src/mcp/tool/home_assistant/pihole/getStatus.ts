import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Pihole } from '../../../../clients/homeAssistant/MySensors/Pihole.ts'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool.ts'

const args = {} as const

type Args = typeof args

export class GetPiholeStatusTool extends AbstractTool<Args> {
  name = 'get-pihole-status'
  description =
    'Retrieve the status of whether or not PiHole is blocking domains that contain ads.'
  args = args

  execute: ToolCallback<Args> = async () => {
    const piholeStatus = await Pihole.getStatus()
    return {
      content: [
        {
          type: 'text',
          text: `The pihole is ${piholeStatus}`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: `An error occurred while getting the pihole status.`
        }
      ]
    }
  }
}
