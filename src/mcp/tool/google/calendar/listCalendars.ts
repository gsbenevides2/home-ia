import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { GoogleCalendar } from '../../../../clients/google/Calendar'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {}

type Args = typeof args
export class ListCalendars extends AbstractTool<Args> {
  name = 'list-calendars'
  description = 'List all available calendars'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error listing calendars' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async () => {
    const calendars = await GoogleCalendar.getInstance().listCalendars()
    if (calendars) {
      const content = calendars.map(cal => ({
        type: 'text',
        text: `Calendar Name: ${cal?.summary || 'Untitled'} - Calendar Id: ${cal?.id || 'no-id'} - Owner Email: ${cal?.owner_email || 'no-owner'} IsDefault: ${cal?.primary ? 'yes' : 'no'}`
      })) as { type: 'text'; text: string }[]
      return {
        content: content
      }
    } else {
      return {
        content: [{ type: 'text', text: 'No calendars found' }]
      }
    }
  }
}
