import { WakeOnLan } from '../../clients/homeAssistant/MySensors/WakeOnLan'
import { TaskJob } from './TaskJob'

export class TurnOnPcWorkDay extends TaskJob {
  name = 'turn-on-pc'
  cron = '5 8 * * *' // Every day at 8:05 AM
  execute = async () => {
    const currentDate = new Date()
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6

    if (!isWeekend) {
      await WakeOnLan.wakeUp(WakeOnLan.devices[0])
    }
  }
}
