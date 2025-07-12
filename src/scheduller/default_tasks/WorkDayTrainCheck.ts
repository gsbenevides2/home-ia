import { TrainSensors } from '../../clients/homeAssistant/MySensors/TrainSensors'
import { Tracer } from '../../logger/Tracer'
import { Chatbot } from '../../mcp/Chatbot'
import { TaskJob } from './TaskJob'

export class WorkDayTrainCheck extends TaskJob {
  name = 'work-day-train-check'
  cron = '* 4-22 * * 2' // Every minute from 4 to 22 on Tuesdays
  unhealtyNotifiedLines: string[] = []
  execute = async () => {
    const tracer = new Tracer()
    tracer.setProgram('WorkDayTrainCheck')
    const checkedTrainLines = ['eleven', 'four', 'nine']
    const transSensorInstance = TrainSensors.getInstance()
    const trainStatus = await Promise.all(
      checkedTrainLines.map(line => transSensorInstance.getTrainLineData(line))
    )

    const unhealtyLines = trainStatus
      .filter(line => line.attributes.status.toLowerCase() !== 'ok')
      .map(line => line.entity_id.replace('sensor.sp_train_', ''))

    const unhealtyUnnotifiedLines = unhealtyLines.filter(
      line => !this.unhealtyNotifiedLines.includes(line)
    )

    const healthyLinesNotifiedAfter = this.unhealtyNotifiedLines.filter(
      line => !unhealtyLines.includes(line)
    )

    if (unhealtyUnnotifiedLines.length > 0) {
      const chatbot = new Chatbot(false)
      await chatbot.init()
      const query = `Puxe o status das linhas de trem e metro: ${unhealtyUnnotifiedLines.join(', ')}. E diga se elas estão ok ou não. Se não estiverem, diga o motivo. Mande isso via mensagem no Discord`
      await chatbot.processQuery(query, undefined, tracer)
      this.unhealtyNotifiedLines.push(...unhealtyUnnotifiedLines)
    }

    if (healthyLinesNotifiedAfter.length > 0) {
      const chatbot = new Chatbot(false)
      await chatbot.init()
      const query = `Puxe o status das linhas de trem e metro: ${healthyLinesNotifiedAfter.join(', ')}. E diga se elas estão ok ou não. Se estiverem, diga que estão ok. Mande isso via mensagem no Discord`
      await chatbot.processQuery(query, undefined, tracer)
      this.unhealtyNotifiedLines = this.unhealtyNotifiedLines.filter(
        line => !healthyLinesNotifiedAfter.includes(line)
      )
    }
  }
}
