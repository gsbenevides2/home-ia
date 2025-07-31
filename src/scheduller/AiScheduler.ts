import { JobDatabase } from '../clients/database/Jobs'
import { Logger } from '../logger'
import { Tracer } from '../logger/Tracer'
import { Chatbot } from '../mcp/Chatbot'
import { CronnerManager } from './CronnerManager'
export interface JobData {
  id: string
  type: 'cron' | 'date'
  time: string
  llm: string
  exclude: boolean
}

export class AiScheduller {
  public static async init() {
    Logger.info('AiScheduller', 'Initializing')
    const dbJobs = await this.getJobs()
    Logger.info('AiScheduller', 'Jobs read', { dbJobs })
    for (const dbJob of dbJobs) {
      const { id, time, type } = dbJob
      const finalTime = type === 'cron' ? time : this.transformTime(time)
      Logger.info('AiScheduller', 'Making cron', { id, finalTime })
      const cron = CronnerManager.newCron(
        finalTime,
        {
          name: id,
          timezone: 'America/Sao_Paulo'
        },
        () => {
          this.callback(id)
        }
      )
      const next = cron.nextRun()
      Logger.info('AiScheduller', 'Cron made', { id, next })
      Logger.info(
        'AiScheduller',
        `Retrived from DB Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
      )
    }
  }

  private static makeId(databaseId: string) {
    return `ai-${databaseId}`
  }

  public static async scheduleJob(data: Omit<JobData, 'id'>) {
    const { type, time, llm, exclude } = data
    Logger.info('AiScheduller', 'Scheduling job', { data })
    const id = await JobDatabase.getInstance().createJob({
      type,
      time,
      llm,
      exclude
    })
    const finalTime = type === 'cron' ? time : this.transformTime(time)
    Logger.info('AiScheduller', 'Making cron', { id, finalTime })
    const cron = CronnerManager.newCron(
      finalTime,
      {
        name: this.makeId(id),
        timezone: 'America/Sao_Paulo'
      },
      () => {
        this.callback(id)
      }
    )
    const next = cron.currentRun()
    Logger.info('AiScheduller', 'Cron made', { id, next })
    Logger.info(
      'AiScheduller',
      `Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
    )
    return id
  }

  public static cancelJob(id: string) {
    Logger.info('AiScheduller', 'Canceling job', { id })
    const job = CronnerManager.getCron(this.makeId(id))
    Logger.info('AiScheduller', 'Job canceled', { id, job })
    if (job) {
      job.stop()
    }
  }

  public static async getJob(id: string) {
    Logger.info('AiScheduller', 'Getting job', { id })
    return await JobDatabase.getInstance().getJob(id)
  }

  public static async getJobs() {
    Logger.info('AiScheduller', 'Getting jobs')
    return await JobDatabase.getInstance().getJobs()
  }

  public static async deleteJob(id: string) {
    Logger.info('AiScheduller', 'Deleting job', { id })
    this.cancelJob(id)
    Logger.info('AiScheduller', 'Job deleted', { id })
    await JobDatabase.getInstance().deleteJob(id)
  }

  private static async callback(id: string) {
    Logger.info('AiScheduller', 'Callback', { id })
    const job = await JobDatabase.getInstance().getJob(id)
    if (!job) {
      Logger.info('AiScheduller', 'Job not found', { id })
      return
    }
    Logger.info('AiScheduller', 'Job found', { id, job })
    const tracer = new Tracer()
    tracer.setProgram('Scheduller')
    tracer.info('Processing job', { job })
    const chatbot = new Chatbot(false)
    await chatbot.init()
    await chatbot.processQuery(job.llm, undefined, tracer)
    if (!job.exclude) {
      Logger.info('AiScheduller', 'Job excluded', { id })
      return
    }
    Logger.info('AiScheduller', 'Job not excluded', { id })
    this.deleteJob(id)
  }

  public static async changeJob(
    id: string,
    data: Partial<Omit<JobData, 'id'>>
  ) {
    Logger.info('AiScheduller', 'Changing job', { id, data })
    const job = await JobDatabase.getInstance().getJob(id)
    if (!job) {
      Logger.info('AiScheduller', 'Job not found', { id })
      return
    }

    const { type, time, llm, exclude } = data
    const timeToUpdate = time ?? job.time
    Logger.info('AiScheduller', 'Updating job', { id, timeToUpdate })
    await JobDatabase.getInstance().updateJob(id, {
      type: type ?? job.type,
      time: timeToUpdate,
      llm: llm ?? job.llm,
      exclude: exclude ?? job.exclude
    })
    Logger.info('AiScheduller', 'Job updated', { id })
    this.cancelJob(id)
    Logger.info('AiScheduller', 'Job canceled', { id })
    const cron = CronnerManager.newCron(
      timeToUpdate,
      { name: this.makeId(id), timezone: 'America/Sao_Paulo' },
      () => this.callback(id)
    )
    Logger.info('AiScheduller', 'Cron made', { id })
    const next = cron.currentRun()
    Logger.info(
      'AiScheduller',
      `Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
    )
    Logger.info('AiScheduller', 'Job updated', { id })
    return {
      id,
      type: type ?? job.type,
      time: timeToUpdate,
      llm: llm ?? job.llm,
      exclude: exclude ?? job.exclude
    }
  }

  public static transformTime(timeString: string): Date {
    Logger.info('AiScheduller', 'Transforming time', { timeString })
    const [date, time] = timeString.split(' ')
    const [year, month, day] = date.split('-')
    const [hour, minute, second] = time.split(':')
    const currentDate = new Date()
    currentDate.setDate(Number(day))
    currentDate.setMonth(Number(month) - 1)
    currentDate.setFullYear(Number(year))
    currentDate.setHours(Number(hour))
    currentDate.setMinutes(Number(minute))
    currentDate.setSeconds(Number(second))
    return currentDate
  }
}
