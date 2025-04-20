import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StatusSensors } from '../../../../clients/homeAssistant/MySensors/StatusSensors'
import { AbstractTool } from '../../AbstractTool'

const args = {} as const

type Args = typeof args

export class GetIdOfPlataformsTool extends AbstractTool<Args> {
  name = 'get-id-of-plataforms'
  description = 'Get the ID of all platforms to get the status of'
  args = args

  execute: ToolCallback<Args> = async () => {
    const status = await StatusSensors.getInstance().getDbStatusPages()
    return {
      content: status.map(status => ({
        type: 'text',
        text: `The ID of the platform ${status.sensor_name} is ${status.sensor_id}`
      }))
    }
  }
}
