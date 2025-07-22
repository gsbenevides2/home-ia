import { AiScheduller } from './AiScheduler'
import { CalendarNotifierScheduller } from './CalendarNotifierScheduler'
import { CronnerManager } from './CronnerManager'
import { TaskScheduller } from './TaskScheduler'

export function StartScheduller() {
  return Promise.all([
    AiScheduller.init(),
    TaskScheduller.init(),
    CalendarNotifierScheduller.init()
  ])
}

export function StopScheduller() {
  CronnerManager.gracefulShutdown()
}
