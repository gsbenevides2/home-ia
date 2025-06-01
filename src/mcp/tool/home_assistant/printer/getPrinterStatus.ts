import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Printer } from '../../../../clients/homeAssistant/MySensors/Printer.ts'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool.ts'

const args = {} as const

type Args = typeof args

export class GetPrinterStatusTool extends AbstractTool<Args> {
  name = 'get-printer-status'
  description =
    'Retrieves comprehensive HP printer status including connection status, printer state, ink levels, and page counts'
  args = args

  execute: ToolCallback<Args> = async () => {
    const printer = new Printer()
    const printerData = await printer.getAllPrinterStatus()

    return {
      content: [
        {
          type: 'text',
          text: `HP Printer Status:
• Connection: ${printerData.connectionStatus}
• Printer Status: ${printerData.printerStatus}
• Color Ink Level (CMY): ${printerData.colorCMYLevel}
• Black Ink Level: ${printerData.colorBlackLevel}
• Total Pages Printed: ${printerData.pagesLevel}
• Total Pages Scanned: ${printerData.scannerLevel}`
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while retrieving printer status.'
        }
      ]
    }
  }
}
