import { Cron } from 'croner'
import { endOfDay, format, startOfDay, subMinutes } from 'date-fns'
import type { calendar_v3 } from 'googleapis'
import { GoogleCalendar } from '../clients/google/Calendar'
import { DiscordBot } from '../discord'
import { Logger } from '../logger'

const NON_EVENTS = ['workingLocation', 'birthday', 'focusTime', 'outOfOffice']
const MINUTES_TO_SUBTRACT = 2
const SYNC_CRON = '*/10 * * * *' // A cada 10 minutos

type EventWithCalendar = calendar_v3.Schema$Event & {
  calendarId: string
  calendarName: string
  calendarOwnerEmail: string
}

export class CalendarNotifierScheduller {
  private static myJobs: Cron[] = []
  private static events: EventWithCalendar[] = []
  private static syncCron: Cron | null = null

  public static async init() {
    await this.sync()
    this.makeSyncCron()
  }

  public static async sync() {
    Logger.info('CalendarNotifierScheduller', 'Syncing events')
    await this.readEvents()
    await this.updateOrScheduleEventsInCron()
    await this.cleanUpDeletedEvents()
    Logger.info('CalendarNotifierScheduller', 'Synced events')
  }

  public static makeSyncCron() {
    this.syncCron = new Cron(
      SYNC_CRON,
      { name: 'calendar-notifier-sync', timezone: 'America/Sao_Paulo' },
      () => this.sync()
    )
  }

  private static makeId(name: string) {
    return `calendar-notifier-${name}`
  }

  private static async readEvents() {
    const calendars = await GoogleCalendar.getInstance().listCalendars()
    const nomDuplicatedCalendars = calendars.filter(
      (calendar, index, self) =>
        index === self.findIndex(t => t.id === calendar.id)
    )
    const start = startOfDay(new Date())
    const end = endOfDay(new Date())
    const gaxiosResponses = await Promise.all(
      nomDuplicatedCalendars.map(calendar =>
        GoogleCalendar.getInstance().listEvents({
          email: calendar.owner_email,
          calendarId: calendar.id!,
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          orderBy: 'startTime',
          singleEvents: true,
          maxResults: 1000
        })
      )
    )
    const events = gaxiosResponses
      .flatMap((response, index) => {
        const calendar = calendars[index]
        return (
          response.data.items?.map(event => ({
            ...event,
            calendarId: calendar.id!,
            calendarName: calendar.summary!,
            calendarOwnerEmail: calendar.owner_email!
          })) ?? []
        )
      })
      .filter(event => !NON_EVENTS.includes(event.eventType ?? ''))
      .filter(
        (event, index, self) => index === self.findIndex(t => t.id === event.id)
      )
    Logger.info(
      'CalendarNotifierScheduller',
      `Retrived ${events.length} events from ${calendars.length} calendars`
    )
    this.events = events
  }

  private static async updateOrScheduleEventsInCron() {
    for (const event of this.events) {
      const id = this.makeId(event.id ?? '')
      const hasScheduled = this.myJobs.find(job => job.name === id)
      if (hasScheduled) {
        hasScheduled.stop()
      }
      const timeToNotify = event.start?.dateTime ?? event.start?.date ?? ''
      const timeSubtracted = subMinutes(
        new Date(timeToNotify),
        MINUTES_TO_SUBTRACT
      )

      const cron = new Cron(
        timeSubtracted.toISOString(),
        { name: id, timezone: 'America/Sao_Paulo' },
        () => {
          this.notifyEvent(event)
        }
      )
      this.myJobs.push(cron)
      Logger.info(
        'CalendarNotifierScheduller',
        `Event ${event.id} scheduled at ${timeSubtracted.toISOString()} next invocation at ${cron.nextRun()?.toISOString()}`
      )
    }
  }

  private static async cleanUpDeletedEvents() {
    const events = this.events
    const myJobs = this.myJobs
    const jobsToRemove = myJobs.filter(
      job => !events.some(event => this.makeId(event.id ?? '') === job.name)
    )
    for (const job of jobsToRemove) {
      Logger.info('CalendarNotifierScheduller', `Event ${job.name} removed`)
      job.stop()
    }
  }

  private static async notifyEvent(event: EventWithCalendar) {
    Logger.info('CalendarNotifierScheduller', `Notifying event ${event.id}`)
    const DiscordClient = await DiscordBot.getInstance()
    let message =
      'Olá, tudo bem? Aqui é o bot do seu calendário, e estou te notificando que você tem um evento em breve.'
    message += `\n - Evento: ${event.summary}`
    const date = event.start?.dateTime ?? event.start?.date
    if (date) {
      message += `\n - Data: ${format(date, 'dd/MM/yyyy HH:mm')}`
    }
    if (event.description) {
      message += `\n - Descrição: ${event.description}`
    }

    if (event.location) {
      message += `\n - Local: ${event.location}`
    }

    if (event.htmlLink) {
      const link = new URL(event.htmlLink)
      if (link.host.includes('google')) {
        link.searchParams.set('authuser', event.calendarOwnerEmail)
      }
      message += `\n - Link para evento: ${link.toString()}`
    }

    if (event.conferenceData?.entryPoints?.[0]?.uri) {
      const uri = new URL(event.conferenceData.entryPoints[0].uri)
      if (uri.host.includes('google')) {
        uri.searchParams.set('authuser', event.calendarOwnerEmail)
      }
      message += `\n - Link para reunião: ${uri.toString()}`
    }

    DiscordClient.sendMessage(message)
  }

  public static gracefulShutdown() {
    for (const job of this.myJobs) {
      job.stop()
    }
    if (this.syncCron) {
      this.syncCron.stop()
    }
  }
}
