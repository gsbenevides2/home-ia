import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { GoogleCalendar } from '../../../../clients/google/Calendar'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'

const args = {
  email: z
    .string()
    .email()
    .describe('Email address of the user to update the event for'),
  calendarId: z
    .string()
    .describe(
      'ID of the calendar containing the event (use "primary" for the main calendar)'
    )
    .default('primary'),
  eventId: z.string().describe('ID of the event to update').nonempty(),
  summary: z.string().describe('Updated title of the event').optional(),
  description: z
    .string()
    .describe('Updated description/notes for the event')
    .optional(),
  start: z
    .string()
    .describe(
      'Updated start time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.'
    )
    .optional(),
  end: z
    .string()
    .describe(
      'Updated end time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset.'
    )
    .optional(),
  timeZone: z
    .string()
    .describe(
      'Updated timezone of the event start/end times, formatted as an IANA Time Zone Database name (e.g., America/Los_Angeles). Its required if start or end is provided.'
    )
    .optional(),
  location: z.string().describe('Updated location of the event').optional(),
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
    .describe('Updated list of attendees')
    .optional(),
  reminders: z
    .object({
      useDefault: z.boolean().describe('Use default reminders').default(true),
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
    })
    .optional(),
  recurrence: z
    .array(z.string())
    .describe(
      'Updated list of recurrence rules (RRULE, EXRULE, RDATE, EXDATE) in RFC5545 format. Example: ["RRULE:FREQ=WEEKLY;COUNT=5"]'
    )
    .optional()
} as const

export type Args = typeof args

export class UpdateEventTool extends AbstractTool<Args> {
  name = 'update-event'
  description = 'Update an existing event in Google Calendar'
  args = args

  execute: ToolCallback<Args> = async args => {
    const result = await GoogleCalendar.getInstance().updateEvent(args)
    const eventId = result.data.id
    return {
      content: [
        { type: 'text', text: `Event updated successfully: ${eventId}` }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [{ type: 'text', text: 'Error updating event' }],
      isError: true
    }
  }
}
