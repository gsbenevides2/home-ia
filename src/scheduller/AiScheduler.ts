import { Cron } from 'croner'
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

export class AiScheduller {
  private static myJobs: Cron[] = []

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
        'AiScheduller',
        `Retrived from DB Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
      )
      this.myJobs.push(cron)
    }
  }

  private static makeId(databaseId: string) {
    return `ai-${databaseId}`
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
        name: this.makeId(id),
        timezone: 'America/Sao_Paulo'
      },
      () => {
        this.callback(id)
      }
    )
    const next = cron.currentRun()
    Logger.info(
      'AiScheduller',
      `Job ${id} scheduled at ${time} next invocation at ${next?.toISOString()}`
    )
    return id
  }

  public static cancelJob(id: string) {
    const job = this.myJobs.find(job => job.name === this.makeId(id))
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
    this.deleteJob(id)
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
      { name: this.makeId(id), timezone: 'America/Sao_Paulo' },
      () => this.callback(id)
    )
    const next = cron.currentRun()
    Logger.info(
      'AiScheduller',
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
    for (const job of this.myJobs) {
      job.stop()
    }
  }
}
