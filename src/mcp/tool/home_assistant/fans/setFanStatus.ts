import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { FanSensors } from '../../../../clients/homeAssistant/MySensors/FanSensors.ts'
import { Logger } from '../../../../logger/index.ts'
import { MCPServerTracerID } from '../../../server.ts'
import { AbstractTool } from '../../AbstractTool.ts'

const args = {
  roomName: z
    .enum(FanSensors.rooms)
    .describe(
      "The name of the room where the smart fan is installed (e.g., 'Quarto Guilherme', 'Sala', 'Cozinha')"
    ),
  velocity: z
    .enum(FanSensors.velocities)
    .describe(
      "The velocity of the fan (e.g., 'Alta', 'Média', 'Baixa', 'Desligado')"
    )
} as const

type Args = typeof args

export class ChangeFanStatusTool extends AbstractTool<Args> {
  name = 'change-fan-status'
  description =
    "Changes the velocity of a specific room's smart fan eg: 'Quarto Guilherme': 'Alto/Médio/Baixo/Desligado'"
  args = args

  execute: ToolCallback<Args> = async args => {
    const roomName = args.roomName
    const velocity = args.velocity
    Logger.info(
      'MCP Server - ChangeFanStatusTool',
      'Changing fan status',
      args,
      MCPServerTracerID.getTracerId()
    )

    try {
      await FanSensors.setFanRoom(roomName, velocity)
      Logger.info(
        'MCP Server - ChangeFanStatusTool',
        'Fan status changed',
        velocity,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: `The fan in the ${roomName} is ${velocity}`
          }
        ]
      }
    } catch (error) {
      Logger.error(
        'MCP Server - ChangeFanStatusTool',
        'Error changing fan status',
        error,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: `An error occurred while changing the fan status for ${roomName}.`
          }
        ]
      }
    }
  }
}
