import { google } from 'googleapis'
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
      orderBy: args.orderBy
    })
  }
}
