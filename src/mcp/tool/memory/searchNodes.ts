import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { KnowledgeGraphManager } from '../../memory/graphManager.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool.js'

const knowledgeGraphManager = new KnowledgeGraphManager()

const args = {
  query: z.string().describe('The search query')
} as const

type Args = typeof args

export class SearchNodesTool extends AbstractTool<Args> {
  name = 'search_nodes'
  description = 'Search for nodes based on a query'
  args = args

  execute: ToolCallback<Args> = async args => {
    const results = await knowledgeGraphManager.searchNodes(args.query)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = error => {
    return {
      content: [
        {
          type: 'text',
          text: `Error searching nodes: ${error.message}`
        }
      ]
    }
  }
}
