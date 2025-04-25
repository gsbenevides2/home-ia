import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { KnowledgeGraphManager } from '../../memory/graphManager.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool.js'

const knowledgeGraphManager = new KnowledgeGraphManager()

const args = {
  relations: z.array(
    z.object({
      from: z
        .string()
        .describe('The name of the entity where the relation starts'),
      to: z.string().describe('The name of the entity where the relation ends'),
      relationType: z.string().describe('The type of the relation')
    })
  )
} as const

type Args = typeof args

export class CreateRelationsTool extends AbstractTool<Args> {
  name = 'create_relations'
  description =
    'Create multiple new relations between entities in the knowledge graph. Relations should be in active voice'
  args = args

  execute: ToolCallback<Args> = async args => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            await knowledgeGraphManager.createRelations(args.relations),
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
          text: `Error creating relations: ${error.message}`
        }
      ]
    }
  }
}
