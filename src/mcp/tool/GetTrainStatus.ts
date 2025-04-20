import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TrainSensors } from "../../clients/homeAssistant/MySensors/TrainSensors.ts";
import { Logger } from "../../logger/index.ts";
import { AbstractTool } from "./AbstractTool.ts";

export const availableTrainLines = ["one", "two", "three", "four", "five", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"] as const;

const args = {
  lineCode: z.enum(availableTrainLines).describe("The code of the metro line (e.g., 'one' for Line 1 - Blue, 'two' for Line 2 - Green)"),
} as const;

type Args = typeof args;

export class GetTrainStatus extends AbstractTool<Args> {
  name = "get-train-status";
  description = "Retrieves the current status and operational information for a specific metro/train line in São Paulo";
  args = args;
  execute: ToolCallback<Args> = async (args) => {
    Logger.info("MCP Server - GetTrainStatus", "Getting train status", args);
    const lineCode = args.lineCode;
    try {
      const trainStatus = await TrainSensors.getInstance().getTrainLineData(lineCode);
      Logger.info("MCP Server - GetTrainStatus", "Train status retrieved", trainStatus);
      return {
        content: [
          {
            type: "text",
            text: `O status da linha ${trainStatus.attributes.codigo} - ${trainStatus.attributes.cor} é ${trainStatus.state} - ${trainStatus.attributes.descricao ?? "OK"}`,
          },
        ],
      };
    } catch (e) {
      Logger.error("MCP Server - GetTrainStatus", "Error getting train status", e);
      return {
        content: [{ type: "text", text: `Ocorreu um erro ao obter o status da linha ${lineCode}. Por favor, tente novamente mais tarde.` }],
      };
    }
  };
}
