import { Logger } from '../logger'
import { CronnerManager } from './CronnerManager'
import { tasks } from './default_tasks/tasks'

export class TaskScheduller {
  private static makeId(name: string) {
    return `task-${name}`
  }

  public static async init() {
    for (const task of tasks) {
      const cron = CronnerManager.newCron(
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
    }
  }
}
