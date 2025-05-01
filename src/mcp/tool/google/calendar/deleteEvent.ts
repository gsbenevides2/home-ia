import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleCalendar } from '../../../../clients/google/Calendar'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z
    .string()
    .email()
    .describe('Email address of the user to delete the event for'),
  calendarId: z
    .string()
    .describe(
      'ID of the calendar containing the event (use "primary" for the main calendar)'
    )
    .default('primary'),
  eventId: z.string().describe('ID of the event to delete').nonempty()
} as const

export type Args = typeof args

export class DeleteEventTool extends AbstractTool<Args> {
  name = 'delete-event'
  description = 'Delete an event from Google Calendar'
  args = args

  execute: ToolCallback<Args> = async args => {
    await GoogleCalendar.getInstance().deleteEvent(args)
    return {
      content: [{ type: 'text', text: 'Event deleted successfully' }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error deleting event' }],
      isError: true
    }
  }
}
