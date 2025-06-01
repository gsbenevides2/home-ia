import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { MySensorsRouter } from '../../../../clients/homeAssistant/MySensors/Router.ts'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool.ts'

const args = {} as const

type Args = typeof args

export class GetRouterDataTool extends AbstractTool<Args> {
  name = 'get-router-data'
  description =
    'Retrieves comprehensive router status including CPU usage, memory usage, total clients, data fetching status, and guest wifi status'
  args = args

  execute: ToolCallback<Args> = async () => {
    const router = new MySensorsRouter()
    const routerData = await router.getRouterData()

    return {
      content: [
        {
          type: 'text',
          text: `Router Status:
• CPU Usage: ${routerData.cpuUsed}
• Memory Usage: ${routerData.memoryUsed}
• Total Clients: ${routerData.totalClients}
• Data Fetching: ${routerData.dataFetching}
• Guest WiFi: ${routerData.guestWifi}
• Download Speed: ${routerData.downloadSpeed}
• Upload Speed: ${routerData.uploadSpeed}
• Ping: ${routerData.ping}`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while retrieving router data.'
        }
      ]
    }
  }
}
