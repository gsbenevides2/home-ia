import { numberToWords } from "../../../utils/numbersToWords.ts";
import { type TrainStatusReturn } from "../../DiretoDosTres.ts";
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
        const sensor = new Sensor(`sensor.sp_train_${codeInWords}`, `sensor.sp_train_${codeInWords}`, {
          friendly_name: `Linha ${line.codigo} - ${line.cor}`,
          icon: `mdi:train`,
          status: line.status,
          codigo: line.codigo,
          cor: line.cor,
          descricao: line.descricao,
        });
        return sensor.sendData(line.situacao);
      })
    );
  }

  async getTrainLineData(lineCodeInWords: string) {
    const sensor = new Sensor(`sensor.sp_train_${lineCodeInWords}`, `sensor.sp_train_${lineCodeInWords}`, {
      friendly_name: `Linha ${lineCodeInWords}`,
      icon: `mdi:train`,
      status: "unknown",
      codigo: lineCodeInWords,
      cor: "unknown",
      descricao: "unknown",
    });
    const response = await sensor.getData();
    return response;
  }
}
