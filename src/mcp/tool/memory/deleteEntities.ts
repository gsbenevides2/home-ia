import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { KnowledgeGraphManager } from '../../memory/graphManager.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool.js'

const knowledgeGraphManager = new KnowledgeGraphManager()

const args = {
  entityNames: z
    .array(z.string())
    .describe('An array of entity names to delete')
} as const

type Args = typeof args

export class DeleteEntitiesTool extends AbstractTool<Args> {
  name = 'delete_entities'
  description =
    'Delete multiple entities and their associated relations from the knowledge graph'
  args = args

  execute: ToolCallback<Args> = async args => {
    await knowledgeGraphManager.deleteEntities(args.entityNames)
    return {
      content: [
        {
          type: 'text',
          text: 'Entities deleted successfully'
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = error => {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting entities: ${error.message}`
        }
      ]
    }
  }
}
