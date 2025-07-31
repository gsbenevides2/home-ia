/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Cron, scheduledJobs, type CronOptions } from 'croner'
import { Logger } from '../logger/index.ts'
export class CronnerManager {
  private static instance: CronnerManager = new CronnerManager()

  private constructor() {}

  public static getInstance() {
    return this.instance
  }

  public static newCron(
    pattern: string | Date,
    fnOrOptions1?: CronOptions | Function,
    fnOrOptions2?: CronOptions | Function
  ) {
    Logger.info('CronnerManager', 'New cron', { pattern })
    const name = fnOrOptions1?.name || fnOrOptions2?.name
    if (!name) {
      throw new Error('Cron name is required')
    }
    Logger.info('CronnerManager', 'Cron name', { name })
    const hasScheduledJob = scheduledJobs.find(job => job.name === name)

    if (hasScheduledJob) {
      Logger.info('CronnerManager', 'Cron already exists', { name })
      hasScheduledJob.stop()
    }

    const cron = new Cron(pattern, fnOrOptions1, fnOrOptions2)
    Logger.info('CronnerManager', 'Cron created', { cron })
    return cron
  }

  public static getCron(name: string) {
    Logger.info('CronnerManager', 'Getting cron', { name })
    return scheduledJobs.find(job => job.name === name)
  }

  public static getCrons() {
    Logger.info('CronnerManager', 'Getting crons')
    return scheduledJobs
  }

  public static gracefulShutdown() {
    Logger.info('CronnerManager', 'Graceful shutdown')
    for (const job of scheduledJobs) {
      job.stop()
    }
  }
}
