import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import axios from 'axios'
import { NodeHtmlMarkdown } from 'node-html-markdown'
import { z } from 'zod'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {
  url: z.string().url().describe('URL of the webpage to convert'),
  depth: z
    .number()
    .min(0)
    .max(3)
    .default(0)
    .optional()
    .describe(
      'Used to access the subpages of the webpage, set the depth, default is 0 (Not Subpages) and max is 3 (Main page -> Subpages -> Subpages -> Subpages)'
    ),
  allowRecusiveForSubpages: z
    .boolean()
    .default(true)
    .optional()
    .describe(
      'If true, the tool will access the subpages of this page, default is true'
    )
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
    let markdResult = markdown
    const urls = markdown.match(/https?:\/\/[^\s]+/g)
    const currentDepth = 0
    while (currentDepth < (args.depth ?? 0)) {
      if (!urls) {
        break
      }
      while (urls.length > 0) {
        const url = urls.shift()
        if (!url) {
          break
        }
        if (args.allowRecusiveForSubpages && !url.startsWith(url)) {
          continue
        }

        const response = await axios.get<string>(url)
        const html = response.data
        const markdown = NodeHtmlMarkdown.translate(html)
        markdResult += markdown
        const newUrls = markdown.match(/https?:\/\/[^\s]+/g)
        if (newUrls) {
          urls.push(...newUrls)
        }
      }
    }
    return { content: [{ type: 'text', text: markdResult }] }
  }
}
