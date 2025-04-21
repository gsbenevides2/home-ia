import { Cron, scheduledJobs } from 'croner'
import { JobDatabase } from '../clients/database/Jobs'
import { Logger } from '../logger'
import { Tracer } from '../logger/Tracer'
import { Chatbot } from '../mcp/Chatbot'

export interface JobData {
  id: string
  type: 'cron' | 'date'
  time: string
  llm: string
  exclude: boolean
}

export class Scheduller {
  public static async init() {
    const dbJobs = await this.getJobs()
    for (const dbJob of dbJobs) {
      const { id, time } = dbJob
      const cron = new Cron(
        time,
        {
          name: id,
          timezone: 'America/Sao_Paulo'
        },
        () => {
          this.callback(id)
        }
      )
      const next = cron.nextRun()
      Logger.info(
        'Scheduller',
        `Retrived from DB Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
      )
    }
  }

  public static async scheduleJob(data: Omit<JobData, 'id'>) {
    const { type, time, llm, exclude } = data
    const id = await JobDatabase.getInstance().createJob({
      type,
      time,
      llm,
      exclude
    })
    const cron = new Cron(
      time,
      {
        name: id,
        timezone: 'America/Sao_Paulo'
      },
      () => {
        this.callback(id)
      }
    )
    const next = cron.currentRun()
    Logger.info(
      'Scheduller',
      `Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
    )
    return id
  }

  public static cancelJob(name: string) {
    const job = scheduledJobs.find(job => job.name === name)
    if (job) {
      job.stop()
    }
  }

  public static async getJob(id: string) {
    return await JobDatabase.getInstance().getJob(id)
  }

  public static async getJobs() {
    return await JobDatabase.getInstance().getJobs()
  }

  public static async deleteJob(id: string) {
    this.cancelJob(id)
    await JobDatabase.getInstance().deleteJob(id)
  }

  private static async callback(id: string) {
    const job = await JobDatabase.getInstance().getJob(id)
    if (!job) return
    const tracer = new Tracer()
    tracer.setProgram('Scheduller')
    tracer.info('Processing job', { job })
    const chatbot = new Chatbot(false)
    await chatbot.init()
    await chatbot.processQuery(job.llm, undefined, tracer)
    if (!job.exclude) return
    this.cancelJob(id)
    await JobDatabase.getInstance().deleteJob(id)
  }

  public static async changeJob(
    id: string,
    data: Partial<Omit<JobData, 'id'>>
  ) {
    const job = await JobDatabase.getInstance().getJob(id)
    if (!job) return

    const { type, time, llm, exclude } = data
    const timeToUpdate = time ?? job.time
    await JobDatabase.getInstance().updateJob(id, {
      type: type ?? job.type,
      time: timeToUpdate,
      llm: llm ?? job.llm,
      exclude: exclude ?? job.exclude
    })
    this.cancelJob(id)
    const cron = new Cron(
      timeToUpdate,
      { name: id, timezone: 'America/Sao_Paulo' },
      () => this.callback(id)
    )
    const next = cron.currentRun()
    Logger.info(
      'Scheduller',
      `Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
    )
    return {
      id,
      type: type ?? job.type,
      time: timeToUpdate,
      llm: llm ?? job.llm,
      exclude: exclude ?? job.exclude
    }
  }

  public static gracefulShutdown() {
    scheduledJobs.forEach(job => {
      job.stop()
    })
  }
}
