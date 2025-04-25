import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { KnowledgeGraphManager } from '../../memory/graphManager.js'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool.js'

const knowledgeGraphManager = new KnowledgeGraphManager()

const args = {
  names: z.array(z.string()).describe('The names of the nodes to open')
} as const

type Args = typeof args

export class OpenNodesTool extends AbstractTool<Args> {
  name = 'open_nodes'
  description = 'Open specific nodes by their names'
  args = args

  execute: ToolCallback<Args> = async args => {
    const nodes = await knowledgeGraphManager.openNodes(args.names)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(nodes, null, 2)
        }
      ]
    }
  }

  onError: OnErrorToolCallback<Args> = error => {
    return {
      content: [
        {
          type: 'text',
          text: `Error opening nodes: ${error.message}`
        }
      ]
    }
  }
}
