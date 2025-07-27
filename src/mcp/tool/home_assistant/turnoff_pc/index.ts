import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { TurnOffPc } from '../../../../clients/homeAssistant/MySensors/TurnOffPc'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {} as const

type Args = typeof args

export class TurnOffPcTool extends AbstractTool<Args> {
  name = 'turn_off_pc'
  description = 'Turn off the PC'
  args = args

  execute: ToolCallback<Args> = async () => {
    await TurnOffPc.getInstance().turnOffPc()
    return {
      content: [{ type: 'text', text: 'PC turned off' }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error turning off PC' }]
    }
  }
}
