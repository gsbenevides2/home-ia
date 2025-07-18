import { Cron } from 'croner'
import { Logger } from '../logger'
import { tasks } from './default_tasks/tasks'

export class TaskScheduller {
  private static myJobs: Cron[] = []

  private static makeId(name: string) {
    return `task-${name}`
  }

  public static async init() {
    for (const task of tasks) {
      const cron = new Cron(
        task.cron,
        {
          name: this.makeId(task.name),
          timezone: 'America/Sao_Paulo'
        },
        () => {
          task.execute()
        }
      )
      const next = cron.nextRun()
      Logger.info(
        'TaskScheduller',
        `Retrived from LocalTask ${task.name} scheduled at ${task.cron} next invocation at ${next?.toISOString()}`
      )
      this.myJobs.push(cron)
    }
  }

  public static gracefulShutdown() {
    for (const job of this.myJobs) {
      job.stop()
    }
  }
}
