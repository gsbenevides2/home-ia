/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Cron, scheduledJobs, type CronOptions } from 'croner'

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
    const name = fnOrOptions1?.name || fnOrOptions2?.name
    if (!name) {
      throw new Error('Cron name is required')
    }
    const hasScheduledJob = scheduledJobs.find(job => job.name === name)

    if (hasScheduledJob) {
      hasScheduledJob.stop()
    }

    const cron = new Cron(pattern, fnOrOptions1, fnOrOptions2)
    return cron
  }

  public static getCron(name: string) {
    return scheduledJobs.find(job => job.name === name)
  }

  public static getCrons() {
    return scheduledJobs
  }

  public static gracefulShutdown() {
    for (const job of scheduledJobs) {
      job.stop()
    }
  }
}
