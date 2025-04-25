import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { KnowledgeGraphManager } from '../../memory/graphManager.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool.js'

const knowledgeGraphManager = new KnowledgeGraphManager()

const args = {
  entities: z.array(
    z.object({
      name: z.string().describe('The name of the entity'),
      entityType: z.string().describe('The type of the entity'),
      observations: z
        .array(z.string())
        .describe('An array of observation contents associated with the entity')
    })
  )
} as const

type Args = typeof args

export class CreateEntitiesTool extends AbstractTool<Args> {
  name = 'create_entities'
  description = 'Create multiple new entities in the knowledge graph'
  args = args

  execute: ToolCallback<Args> = async args => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await knowledgeGraphManager.createEntities(args.entities),
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
          text: `Error creating entities: ${error.message}`
        }
      ]
    }
  }
}
