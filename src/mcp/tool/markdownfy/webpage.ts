import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import axios from 'axios'
import { NodeHtmlMarkdown } from 'node-html-markdown'
import { z } from 'zod'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {
  url: z.string().url().describe('URL of the webpage to convert')
} as const

type Args = typeof args

export class MarkdownfyWebpage extends AbstractTool<Args> {
  name = 'markdownfy-webpage'
  description = 'Convert a webpage to markdown'
  args = args

  onError: OnErrorToolCallback<Args> = () => {
    return {
      content: [
        { type: 'text', text: 'Failed to convert webpage to markdown' }
      ],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    const { url } = args

    const response = await axios.get<string>(url)
    const html = response.data

    const markdown = NodeHtmlMarkdown.translate(html)
    return { content: [{ type: 'text', text: markdown }] }
  }
}
