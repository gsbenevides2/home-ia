import axios from "axios";
import { Logger } from "../logger/index.ts";

interface StatusReturn {
  codigo: number;
  descricao?: string;
  situacao: string;
}

const colors = {
  1: "Azul",
  2: "Verde",
  3: "Vermelha",
  4: "Amarela",
  5: "Lilás",
  7: "Rubí",
  8: "Diamante",
  9: "Esmeralda",
  10: "Turquesa",
  11: "Coral",
  12: "Safira",
  13: "Jade",
  15: "Prata",
};

export interface TrainStatusReturn {
  status: string;
  codigo: number;
  descricao?: string;
  situacao: string;
  cor: string;
}

export class DiretoDosTrens {
  static instance = new DiretoDosTrens();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  private getStatus(situation: string) {
    const lowerSituation = situation.toLowerCase();
    if (lowerSituation.includes("normal")) return "OK";
    const warningStatus = [
      "atividade programada",
      "circulação de trens",
      "impacto pontual",
      "diferenciada",
      "especial",
      "parcial",
      "velocidade reduzida",
    ];
    if (warningStatus.some((status) => lowerSituation.includes(status)))
      return "WARNING";
    if (lowerSituation.includes("paralisada")) return "CRITICAL";
    if (lowerSituation.includes("encerrada")) return "UNKNOWN";
    return "UNKNOWN";
  }

  async getLines(): Promise<TrainStatusReturn[]> {
    const lineResponse = await axios.get<StatusReturn[]>(
      "https://www.diretodostrens.com.br/api/status",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      },
    );
    Logger.info("DiretoDosTrens", "Line response", lineResponse.data);

    return lineResponse.data.map((line) => {
      const status = this.getStatus(line.situacao);

      return {
        status,
        codigo: line.codigo,
        descricao: line.descricao,
        situacao: line.situacao,
        cor: colors[line.codigo as keyof typeof colors],
      };
    });
  }
}
