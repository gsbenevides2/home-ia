import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleCalendar } from '../../../../clients/google/Calendar'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z
    .string()
    .email()
    .describe('Email address of the user to create the event for'),
  calendarId: z
    .string()
    .describe(
      'ID of the calendar to create the event in (use "primary" for the main calendar and list-calendars tool to get all calendars)'
    )
    .default('primary'),
  summary: z.string().describe('Title of the event').nonempty(),
  description: z
    .string()
    .describe('Description/notes for the event (optional)')
    .optional(),
  start: z
    .string()
    .describe(
      'Start time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.'
    ),
  end: z
    .string()
    .describe(
      'End time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.'
    ),
  timeZone: z
    .string()
    .describe(
      'Timezone of the event start/end times, formatted as an IANA Time Zone Database name (e.g., America/Los_Angeles). Required if start/end times are specified, especially for recurring events.'
    )
    .default('America/Sao_Paulo'),
  location: z.string().describe('Location of the event (optional)').optional(),
  attendees: z
    .array(
      z.object({
        email: z
          .string()
          .email()
          .describe('Email address of the attendee')
          .nonempty()
      })
    )
    .describe('List of attendees (optional)')
    .optional(),
  reminders: z.object({
    useDefault: z
      .boolean()
      .describe('Use default reminders (optional)')
      .default(true),
    overrides: z
      .array(
        z.object({
          method: z
            .enum(['email', 'popup'])
            .describe(
              'Reminder method (defaults to popup unless email is specified)'
            )
            .default('popup'),
          minutes: z
            .number()
            .describe('Minutes before event to send reminder')
            .nonnegative()
        })
      )
      .describe(
        'Custom reminders (uses popup notifications by default unless email is specified)'
      )
      .optional()
  }),
  recurrence: z
    .array(z.string())
    .describe(
      'List of recurrence rules (RRULE, EXRULE, RDATE, EXDATE) in RFC5545 format (optional). Example: ["RRULE:FREQ=WEEKLY;COUNT=5"]'
    )
    .optional()
} as const

export type Args = typeof args

export class CreateEventTool extends AbstractTool<Args> {
  name = 'create-event'
  description = 'Create an event in Google Calendar'
  args = args

  execute: ToolCallback<Args> = async args => {
    const result = await GoogleCalendar.getInstance().createEvent(args)
    const eventId = result.data.id
    const text = eventId
      ? `Event created successfully and your event id is: ${eventId}`
      : 'Event created successfully'
    return {
      content: [{ type: 'text', text }]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error creating event' }],
      isError: true
    }
  }
}
