import { AiScheduller } from './AiScheduler'
import { CalendarNotifierScheduller } from './CalendarNotifierScheduler'
import { TaskScheduller } from './TaskScheduler'

export function StartScheduller() {
  return Promise.all([
    AiScheduller.init(),
    TaskScheduller.init(),
    CalendarNotifierScheduller.init()
  ])
}

export function StopScheduller() {
  return Promise.all([
    AiScheduller.gracefulShutdown(),
    TaskScheduller.gracefulShutdown(),
    CalendarNotifierScheduller.gracefulShutdown()
  ])
}
