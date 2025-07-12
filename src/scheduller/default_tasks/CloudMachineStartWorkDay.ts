import { DiscordBot } from '../../discord'
import { addToQueue } from '../../queue/queue'
import { TaskJob } from './TaskJob'

export class CloudMachineStartWorkDay extends TaskJob {
  name = 'cloud-machine-start-work-day'
  cron = '48 7 * * 2' // Every Tuesday at 7:48 AM
  execute = async () => {
    addToQueue('codespaces-start')
    DiscordBot.getInstance().sendMessage(
      'Olá, eu estou iniciando a VM do Codespaces no GCP'
    )
  }
}
