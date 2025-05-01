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
    .optional(),

  singleEvents: z
    .boolean()
    .describe(
      'Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.'
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
    if (events.data.items) {
      const content = this.formatEventList(events.data.items)

      return {
        content: content
      }
    } else {
      return {
        content: [{ type: 'text', text: 'No events found' }]
      }
    }
  }

  formatEventList(
    events: calendar_v3.Schema$Event[]
  ): { type: 'text'; text: string }[] {
    return events
      .map(event => {
        let msg = `Event Title: ${event.summary} Event ID: ${event.id || 'no-id'}`

        msg += `\nEvent Start Time: ${event.start?.dateTime || event.start?.date || 'no-start-time'}`
        msg += `\nEvent End Time: ${event.end?.dateTime || event.end?.date || 'no-end-time'}`

        if (event.attendees?.length !== 0) {
          const makeStatus = (status: string) => {
            if (status === 'needsAction')
              return 'Needs To Accept The Invitation'
            if (status === 'accepted') return 'Accepted The Invitation'
            if (status === 'tentative') return 'Maybe Will Attend'
            if (status === 'declined') return 'Declined The Invitation'
            return status
          }

          const list = event.attendees?.map(a => {
            return `Attendee Name: ${a.displayName || 'no-name'} - Attendee Email: ${a.email || 'no-email'} - Attendee Status: ${makeStatus(a.responseStatus || 'unknown')}`
          })
          msg += `\nAttendees: ${list?.join('; ')}`
        }
        if (event.location) {
          msg += `\nLocation: ${event.location}`
        }
        if (event.colorId) {
          msg += `\nColor ID: ${event.colorId}`
        }
        if (event.hangoutLink) {
          msg += `\nMeeting Link: ${event.hangoutLink}`
        }
        if (event.reminders) {
          const overrides = event.reminders.overrides || []
          const reminders = overrides.map(r => {
            return `Reminder Send Method: ${r.method} - Reminder Minutes Before The Event: ${r.minutes}`
          })
          msg += `\nReminders: ${
            event.reminders.useDefault
              ? 'Using default'
              : reminders.join('; ') || 'None'
          }`
        }
        if (event.organizer) {
          if (event.organizer.self) {
            msg += `\nOrganizer: You`
          } else {
            msg += `\nOrganizer Name: ${event.organizer.displayName || 'no-name'} - Organizer Email: ${event.organizer.email || 'no-email'}`
          }
        }
        if (event.workingLocationProperties) {
          msg += `\nWorking Location Properties: ${event.workingLocationProperties.type}`
          if (event.organizer?.self) {
            msg += ` Obs: This event is your working location in this day`
          }
        }
        if (event.birthdayProperties) {
          msg += `\nThis event is a birthday`
          if (event.birthdayProperties?.type === 'self') {
            msg += ` and it's your birthday in this day. Congrats!`
          }
        }
        return msg
      })
      .map(event => ({
        type: 'text',
        text: event
      }))
  }
}
