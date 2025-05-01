import { google } from 'googleapis'
import type { z } from 'zod'
import { type Args as CreateEventArgs } from '../../mcp/tool/google/calendar/createEvent'
import { OauthClient } from './OauthClient'
export class GoogleCalendar {
  private static instance: GoogleCalendar

  public static getInstance(): GoogleCalendar {
    return new GoogleCalendar()
  }

  public async listCalendars() {
    const allClients =
      await OauthClient.getInstance().prepareOauthClientsForAllEmails()
    const calendars = await Promise.all(
      allClients.map(async client => {
        const calendar = google.calendar({
          version: 'v3',
          auth: client.oauth2Client
        })
        return {
          ower_email: client.email,
          calendars: await calendar.calendarList.list()
        }
      })
    )
    return calendars.flatMap(item => {
      const email = item.ower_email
      return (
        item.calendars.data.items?.map(cal => ({
          owner_email: email,
          ...cal
        })) ?? []
      )
    })
  }

  public async listEvents(args: {
    email: string
    calendarId: string
    timeMin?: string
    timeMax?: string
    maxResults?: number
    orderBy?: string
    singleEvents?: boolean
  }) {
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    return calendar.events.list({
      calendarId: args.calendarId,
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      maxResults: args.maxResults,
      orderBy: args.orderBy,
      singleEvents: args.singleEvents
    })
  }

  public async createEvent(
    args: z.objectOutputType<CreateEventArgs, z.ZodTypeAny>
  ) {
    const { email, ...rest } = args
    const oauth2Client = await OauthClient.getInstance().getOauthClient(email)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    return calendar.events.insert({
      calendarId: args.calendarId,
      requestBody: {
        ...rest,
        start: {
          dateTime: rest.start,
          timeZone: rest.timeZone
        },
        end: {
          dateTime: rest.end,
          timeZone: rest.timeZone
        }
      }
    })
  }

  public async deleteEvent(args: {
    email: string
    calendarId: string
    eventId: string
  }) {
    const { email, calendarId, eventId } = args
    const oauth2Client = await OauthClient.getInstance().getOauthClient(email)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    return calendar.events.delete({
      calendarId,
      eventId
    })
  }

  public async updateEvent(args: {
    email: string
    calendarId: string
    eventId: string
    summary?: string
    description?: string
    start?: string
    end?: string
    timeZone?: string
    location?: string
    attendees?: { email: string }[]
    reminders?: {
      useDefault: boolean
      overrides?: { method: 'email' | 'popup'; minutes: number }[]
    }
    recurrence?: string[]
  }) {
    const { email, calendarId, eventId, start, end, timeZone, ...rest } = args
    const oauth2Client = await OauthClient.getInstance().getOauthClient(email)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Prepare request body
    const requestBody: Record<string, unknown> = { ...rest }

    // Handle start and end times if provided
    if (start && timeZone) {
      requestBody.start = {
        dateTime: start,
        timeZone: timeZone
      }
    }

    if (end && timeZone) {
      requestBody.end = {
        dateTime: end,
        timeZone: timeZone
      }
    }

    return calendar.events.patch({
      calendarId,
      eventId,
      requestBody
    })
  }
}
