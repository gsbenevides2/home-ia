import { Logger } from '../logger'
import { CronnerManager } from './CronnerManager'
import { tasks } from './default_tasks/tasks'

export class TaskScheduller {
  private static makeId(name: string) {
    return `task-${name}`
  }

  public static async init() {
    Logger.info('TaskScheduller', 'Initializing')
    for (const task of tasks) {
      Logger.info('TaskScheduller', 'Making cron', { task })
      const cron = CronnerManager.newCron(
        task.cron,
        {
          name: this.makeId(task.name),
          timezone: 'America/Sao_Paulo'
        },
        () => {
          Logger.info('TaskScheduller', 'Executing task', { task })
          task.execute()
        }
      )
      Logger.info('TaskScheduller', 'Cron made', { task })
      const next = cron.nextRun()
      Logger.info(
        'TaskScheduller',
        `Retrived from LocalTask ${task.name} scheduled at ${task.cron} next invocation at ${next?.toISOString()}`
      )
      Logger.info('TaskScheduller', 'Next run', { task, next })
    }
    Logger.info('TaskScheduller', 'Initialized')
  }
}
