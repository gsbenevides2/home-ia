import { Logger } from '../logger/index.ts'
import { AiScheduller } from './AiScheduler'
import { CalendarNotifierScheduller } from './CalendarNotifierScheduler'
import { CronnerManager } from './CronnerManager'
import { TaskScheduller } from './TaskScheduler'

export function StartScheduller() {
  Logger.info('SchedulerManager', 'Starting scheduller')
  return Promise.all([
    AiScheduller.init(),
    TaskScheduller.init(),
    CalendarNotifierScheduller.init()
  ])
}

export function StopScheduller() {
  Logger.info('SchedulerManager', 'Stopping scheduller')
  CronnerManager.gracefulShutdown()
}
