import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { calendar_v3 } from 'googleapis'
import { z } from 'zod'
import { GoogleCalendar } from '../../../../clients/google/Calendar'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'
// ISO datetime regex that requires timezone designator (Z or +/-HH:MM)
const isoDateTimeWithTimezone =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/

const args = {
  email: z.string().describe('The email of the user'),
  calendarId: z
    .string()
    .describe(
      "ID of the calendar to list events from (use 'primary' for the main calendar)"
    ),
  timeMin: z
    .string()
    .regex(
      isoDateTimeWithTimezone,
      'Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z)'
    )
    .describe(
      'Start time in ISO format with timezone required (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.'
    )
    .optional(),

  timeMax: z
    .string()
    .describe(
      'End time in ISO format with timezone required (e.g., 2024-12-31T23:59:59Z or 2024-12-31T23:59:59+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.'
    )
    .regex(
      isoDateTimeWithTimezone,
      'Must be ISO format with timezone (e.g., 2024-12-31T23:59:59Z)'
    )
    .optional(),
  maxResults: z
    .number()
    .describe(
      'Maximum number of events returned on one result page. The number of events in the resulting page may be less than this value, or none at all, even if there are more events matching the query. Incomplete pages can be detected by a non-empty nextPageToken field in the response. By default the value is 250 events. The page size can never be larger than 2500 events.'
    )
    .optional(),
  orderBy: z
    .enum(['startTime', 'updated'])
    .describe(
      'The order of the events returned in the result. Optional. The default is an unspecified, stable order. Acceptable values are:"startTime": Order by the start date/time (ascending). This is only available when querying single events (i.e. the parameter singleEvents is True); "updated": Order by last modification time (ascending).'
    )
    .optional()
}

type Args = typeof args
export class ListEvents extends AbstractTool<Args> {
  name = 'list-events'
  description = 'List events from a calendar'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error listing calendars' }],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const events = await GoogleCalendar.getInstance().listEvents(args)
    const content = this.formatEventList(events.data.items || [])
    return {
      content: [{ type: 'text', text: content }]
    }
  }

  formatEventList(events: calendar_v3.Schema$Event[]): string {
    return events
      .map(event => {
        const attendeeList = event.attendees
          ? `\nAttendees: ${event.attendees
              .map(
                a =>
                  `${a.email || 'no-email'} (${a.responseStatus || 'unknown'})`
              )
              .join(', ')}`
          : ''
        const locationInfo = event.location
          ? `\nLocation: ${event.location}`
          : ''
        const colorInfo = event.colorId ? `\nColor ID: ${event.colorId}` : ''
        const reminderInfo = event.reminders
          ? `\nReminders: ${
              event.reminders.useDefault
                ? 'Using default'
                : (event.reminders.overrides || [])
                    .map(r => `${r.method} ${r.minutes} minutes before`)
                    .join(', ') || 'None'
            }`
          : ''
        return `${event.summary || 'Untitled'} (${event.id || 'no-id'})${locationInfo}\nStart: ${event.start?.dateTime || event.start?.date || 'unspecified'}\nEnd: ${event.end?.dateTime || event.end?.date || 'unspecified'}${attendeeList}${colorInfo}${reminderInfo}\n`
      })
      .join('\n')
  }
}
