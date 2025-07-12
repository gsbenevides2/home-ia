import { addToQueue } from '../../queue/queue'
import { TaskJob } from './TaskJob'

export class UpdateSensors extends TaskJob {
  name = 'update_sensors'
  cron = '* * * * *' // Every minute
  execute = async () => {
    addToQueue('update-sensors')
  }
}
