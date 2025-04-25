import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { KnowledgeGraphManager } from '../../memory/graphManager.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool.js'

const knowledgeGraphManager = new KnowledgeGraphManager()

const args = {} as const

type Args = typeof args

export class ReadGraphTool extends AbstractTool<Args> {
  name = 'read_graph'
  description = 'Read the entire knowledge graph'
  args = args

  execute: ToolCallback<Args> = async () => {
    const graph = await knowledgeGraphManager.readGraph()
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(graph, null, 2)
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = error => {
    return {
      content: [
        {
          type: 'text',
          text: `Error reading graph: ${error.message}`
        }
      ]
    }
  }
}
