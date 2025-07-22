import { StatusSensors } from '../../clients/homeAssistant/MySensors/StatusSensors'
import { Tracer } from '../../logger/Tracer'
import { Chatbot } from '../../mcp/Chatbot'
import { TaskJob } from './TaskJob'

export class PlatformStatusMonitor extends TaskJob {
  name = 'platform-status-monitor'
  cron = '* * * * *' // Every minute
  problematicPlatforms: string[] = []

  execute = async () => {
    const tracer = new Tracer()
    tracer.setProgram('PlatformStatusMonitor')
    
    const statusSensors = StatusSensors.getInstance()
    const statusPages = await statusSensors.getDbStatusPages()
    
    const platformsWithProblems: string[] = []
    
    for (const statusPage of statusPages) {
      try {
        const sensorData = await statusSensors.getStatus(statusPage.sensor_id)
        
        if (sensorData.state === 'on') {
          platformsWithProblems.push(statusPage.sensor_name)
        }
      } catch (error) {
        tracer.error('Error checking platform status', { 
          sensorId: statusPage.sensor_id,
          error 
        })
      }
    }

    const newProblematicPlatforms = platformsWithProblems.filter(
      platform => !this.problematicPlatforms.includes(platform)
    )

    const recoveredPlatforms = this.problematicPlatforms.filter(
      platform => !platformsWithProblems.includes(platform)
    )

    if (newProblematicPlatforms.length > 0) {
      const chatbot = new Chatbot(false)
      await chatbot.init()
      const query = `🔴 ALERTA: As seguintes plataformas estão com problemas: ${newProblematicPlatforms.join(', ')}. Verifique o status e informe via mensagem no Discord com detalhes dos problemas encontrados.`
      await chatbot.processQuery(query, undefined, tracer)
      this.problematicPlatforms.push(...newProblematicPlatforms)
    }

    if (recoveredPlatforms.length > 0) {
      const chatbot = new Chatbot(false)
      await chatbot.init()
      const query = `🟢 RECUPERAÇÃO: As seguintes plataformas voltaram ao normal: ${recoveredPlatforms.join(', ')}. Mande essa informação via mensagem no Discord.`
      await chatbot.processQuery(query, undefined, tracer)
      this.problematicPlatforms = this.problematicPlatforms.filter(
        platform => !recoveredPlatforms.includes(platform)
      )
    }
  }
}