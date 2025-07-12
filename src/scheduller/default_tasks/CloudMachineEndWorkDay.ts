import { DiscordBot } from '../../discord'
import { addToQueue } from '../../queue/queue'
import { TaskJob } from './TaskJob'

export class CloudMachineEndWorkDay extends TaskJob {
  name = 'cloud-machine-end-work-day'
  cron = '30 18 * * 2' // Every Tuesday at 6:30 PM
  execute = async () => {
    addToQueue('codespaces-stop')
    DiscordBot.getInstance().sendMessage(
      'Olá, eu estou parando a VM do Codespaces no GCP'
    )
  }
}
