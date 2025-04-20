import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  availableLightsNames,
  TuyaLight
} from '../../../../clients/homeAssistant/MySensors/TuyaLight.ts'
import { Logger } from '../../../../logger/index.ts'
import { MCPServerTracerID } from '../../../server.ts'
import { AbstractTool } from '../../AbstractTool.ts'

const args = {
  roomName: z
    .enum(availableLightsNames)
    .describe(
      "The name of the room where the smart light is installed (e.g., 'bedroom', 'living_room')"
    )
} as const

type Args = typeof args

export class GetRoomLampTool extends AbstractTool<Args> {
  name = 'get-room-light-status'
  description =
    "Retrieves the current on/off status of a specific room's smart light"
  args = args

  execute: ToolCallback<Args> = async args => {
    const roomName = args.roomName
    Logger.info(
      'MCP Server - GetRoomLampTool',
      'Getting lamp status',
      args,
      MCPServerTracerID.getTracerId()
    )
    try {
      const lightState = await TuyaLight.getLightState(roomName)
      Logger.info(
        'MCP Server - GetRoomLampTool',
        'Lamp status retrieved',
        lightState,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: `The light in the ${roomName} is currently ${lightState}`
          }
        ]
      }
    } catch (error) {
      Logger.error(
        'MCP Server - GetRoomLampTool',
        'Error getting lamp status',
        error,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: `An error occurred while getting the light status for ${roomName}.`
          }
        ]
      }
    }
  }
}
