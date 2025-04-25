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

export class DeleteRelationsTool extends AbstractTool<Args> {
  name = 'delete_relations'
  description = 'Delete multiple relations from the knowledge graph'
  args = args

  execute: ToolCallback<Args> = async args => {
    await knowledgeGraphManager.deleteRelations(args.relations)
    return {
      content: [
        {
          type: 'text',
          text: 'Relations deleted successfully'
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = error => {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting relations: ${error.message}`
        }
      ]
    }
  }
}
