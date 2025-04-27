import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type {
  ServerNotification,
  ServerRequest
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { AbstractTool, type OnErrorToolCallback } from '../../AbstractTool'
import { GetIdOfPlataformsTool } from './getIdOfPlataforms'

const args = {
  plataform_ids: z
    .array(z.string())
    .describe(
      'The IDs of the platforms to get the status of, you can get the IDs with the get-platform-ids tool'
    )
} as const

type Args = typeof args

export class GetMultiplePlatformStatusTool extends AbstractTool<Args> {
  name = 'get-multiple-platform-status'
  description = 'Get the status of multiple platforms'
  args = args

  execute: ToolCallback<Args> = async args => {
    const content: { type: 'text'; text: string }[] = []
    const tool = new GetIdOfPlataformsTool()

    for (const plataform_id of args.plataform_ids) {
      const status = await tool.execute(
        {
          plataform_id
        },
        {} as RequestHandlerExtra<ServerRequest, ServerNotification>
      )
      content.push(...(status.content as { type: 'text'; text: string }[]))
    }
    return {
      content: content
    }
  }

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while getting the platform status'
        }
      ]
    }
  }
}
