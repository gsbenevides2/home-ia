import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CodespacesSensor } from '../../../../clients/homeAssistant/MySensors/CodespacesSensor.ts'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool.ts'

const args = {} as const
type Args = typeof args

export class GetCodespacesStatusTool extends AbstractTool<Args> {
  name = 'get-the-codespaces-machine'
  description =
    'Get the status of the Google Cloud virtual machine on Conpute Engine called Codespaces to check if it is running or not'
  args = args

  execute: ToolCallback<Args> = async () => {
    const codespacesStatus =
      await CodespacesSensor.getInstance().getCodespacesStatus()
    return {
      content: [
        {
          type: 'text',
          text: `The codespaces status is ${codespacesStatus}`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while getting the codespaces status'
        }
      ]
    }
  }
}
