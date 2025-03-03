import { TrainStatusReturn } from "../../clients/DiretoDosTres.ts";
import { numberToWords } from "../../utils/numbersToWords.ts";
import { Sensor } from "../AbstractEntities/Sensor.ts";

export class TrainSensors {
  private static instance: TrainSensors = new TrainSensors();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  async updateSensors(lineStatus: TrainStatusReturn[]) {
    await Promise.all(
      lineStatus.map((line) => {
        const codeInWords = numberToWords(line.codigo);
        if (!codeInWords) return;
        const sensor = new Sensor(`sp_train_${codeInWords}`, `sp_train_${codeInWords}`, {
          friendly_name: `Linha ${line.codigo} - ${line.cor}`,
          icon: `mdi:train`,
          status: line.status,
          codigo: line.codigo,
          cor: line.cor,
          descricao: line.descricao,
        });
        return sensor.sendState(line.situacao);
      })
    );
  }
}
