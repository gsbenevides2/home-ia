import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { KnowledgeGraphManager } from '../../memory/graphManager.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool.js'

const knowledgeGraphManager = new KnowledgeGraphManager()

const args = {
  observations: z.array(
    z.object({
      entityName: z
        .string()
        .describe('The name of the entity to add the observations to'),
      contents: z
        .array(z.string())
        .describe('An array of observation contents to add')
    })
  )
} as const

type Args = typeof args

export class AddObservationsTool extends AbstractTool<Args> {
  name = 'add_observations'
  description =
    'Add new observations to existing entities in the knowledge graph'
  args = args

  execute: ToolCallback<Args> = async args => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await knowledgeGraphManager.addObservations(args.observations),
            null,
            2
          )
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = error => {
    return {
      content: [
        {
          type: 'text',
          text: `Error adding observations: ${error.message}`
        }
      ]
    }
  }
}
