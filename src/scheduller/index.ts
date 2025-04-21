import { randomUUIDv7 } from 'bun'
import nodeSchedule, { Job, type Spec } from 'node-schedule'
import { JobDatabase } from '../clients/database/Jobs'
import { Logger } from '../logger'
import { MCPClient } from '../mcp/client'

export interface JobData {
  id: string
  type: 'cron' | 'date'
  time: string
  llm: string
  exclude: boolean
}

export class Scheduller {
  private static jobs: Map<string, Job> = new Map()

  public static async init() {
    const dbJobs = await this.getJobs()
    for (const dbJob of dbJobs) {
      const { id, type, time } = dbJob
      const spec: Spec = type === 'cron' ? time : new Date(time)
      const job = nodeSchedule.scheduleJob(spec, () => {
        this.callback(id)
      })
      this.jobs.set(id, job)
      Logger.info(
        'Scheduller',
        `Retrived from DB Job ${id} scheduled at ${time}`
      )
    }
    process.on('SIGINT', async () => {
      Logger.info('Scheduller', 'SIGINT received, shutting down...')
      await this.gracefulShutdown()
      process.exit(0)
    })
  }

  public static async scheduleJob(data: Omit<JobData, 'id'>) {
    const { type, time, llm, exclude } = data
    const id = await JobDatabase.getInstance().createJob({
      type,
      time,
      llm,
      exclude
    })
    const spec: Spec = type === 'cron' ? time : new Date(time)
    const job = nodeSchedule.scheduleJob(spec, () => {
      this.callback(id)
    })
    this.jobs.set(id, job)
    Logger.info('Scheduller', `Job ${id} scheduled at ${time}`)
    return id
  }

  public static cancelJob(name: string) {
    const job = this.jobs.get(name)
    if (job) {
      job.cancel()
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
    const tracerId = randomUUIDv7()
    Logger.info('Scheduller', `Processing job ${id}`, { job }, tracerId)
    await MCPClient.getInstance().processQuery(job.llm)
    if (!job.exclude) return
    this.cancelJob(id)
    await JobDatabase.getInstance().deleteJob(id)
  }

  public static gracefulShutdown() {
    for (const job of this.jobs.values()) {
      job.cancel()
    }
  }
}
