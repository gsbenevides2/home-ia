import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Camera } from '../../../../clients/homeAssistant/MySensors/Camera'
import { Logger } from '../../../../logger'
import { MCPServerTracerID } from '../../../server'
import { AbstractTool } from '../../AbstractTool'

const args = {
  area: z
    .enum(Camera.motionDetectionsAreas)
    .describe('The area of the camera to check for movement detection')
}

type Args = typeof args

export class MovimentDetectionTool extends AbstractTool<Args> {
  name = 'moviment-detection'
  description = 'Check if there is movement in the area of the camera'
  args = args

  execute: ToolCallback<Args> = async args => {
    Logger.info(
      'MCP Server - MovimentDetectionTool',
      'Checking if there is movement in the area',
      args,
      MCPServerTracerID.getTracerId()
    )
    try {
      const isMovement = await Camera.getMotionDetectionSensor(args.area)
      Logger.info(
        'MCP Server - MovimentDetectionTool',
        'Movement detection result',
        isMovement,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: isMovement
              ? 'There is movement in the area'
              : 'There is no movement in the area'
          }
        ]
      }
    } catch (error) {
      Logger.error(
        'MCP Server - MovimentDetectionTool',
        'Error checking movement detection',
        error,
        MCPServerTracerID.getTracerId()
      )
      return {
        content: [
          {
            type: 'text',
            text: 'An error occurred while checking movement detection'
          }
        ]
      }
    }
  }
}
