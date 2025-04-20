import Anthropic from '@anthropic-ai/sdk'
import type {
  ContentBlockParam,
  ImageBlockParam,
  MessageParam,
  TextBlockParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlockParam
} from '@anthropic-ai/sdk/resources/messages/messages.mjs'
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.d.ts'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { OAuthClientMetadata } from '@modelcontextprotocol/sdk/shared/auth.d.ts'
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js'
import { randomUUIDv7 } from 'bun'
import { ChatbotDatabase } from '../clients/database/Chatbot.ts'
import { Logger } from '../logger/index.ts'
import { MCPServerTracerID } from './server.ts'

const systemPrompt = await Bun.file('./src/mcp/systemPrompt.txt').text()

class EnvironmentOAuthProvider implements OAuthClientProvider {
  redirectUrl = new URL('http://localhost:3000/sse')
  clientMetadata: OAuthClientMetadata = {
    redirect_uris: [this.redirectUrl.toString()]
  }
  clientInformation = () => {
    return {
      client_id: 'mcp-client-cli',
      client_secret: 'mcp-client-cli-secret',
      client_id_issued_at: Date.now(),
      client_secret_expires_at: Date.now() + 1000 * 60 * 60 * 24 * 30
    }
  }
  tokens = () => {
    return {
      access_token: Bun.env.AUTH_TOKEN!,
      token_type: 'Bearer'
    }
  }
  saveTokens = () => {}
  redirectToAuthorization = () => {}
  saveCodeVerifier = () => {}
  codeVerifier = () => {
    return '1234567890'
  }
}

export class MCPClient {
  private static instance: MCPClient

  public static getInstance(): MCPClient {
    if (!MCPClient.instance) {
      MCPClient.instance = new MCPClient()
    }
    return MCPClient.instance
  }

  private mcp: Client
  private anthropic: Anthropic
  private transport: SSEClientTransport | null = null
  private tools: Tool[] = []

  private messages: MessageParam[] = []

  private constructor() {
    const ANTHROPIC_API_KEY = Bun.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    })
    this.mcp = new Client({ name: 'mcp-client-cli', version: '1.0.0' })
  }
  // methods will go here

  async connectToServer() {
    try {
      const port = Bun.env.PORT || 3000
      this.transport = new SSEClientTransport(
        new URL(`http://localhost:${port}/sse`),
        {
          authProvider: new EnvironmentOAuthProvider()
        }
      )
      await this.mcp.connect(this.transport)
      const toolsResult = await this.mcp.listTools()
      this.tools = toolsResult.tools.map(tool => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema
        }
      })
      Logger.info(
        'MCP Client',
        'Connected to MCP server with tools:',
        this.tools.map(({ name }) => name)
      )
      await this.loadOldMessages()
      Logger.info('MCP Client', 'Loaded old messages:', this.messages)
    } catch (e) {
      Logger.error('MCP Client', 'Failed to connect to MCP server: ', e)
      throw e
    }
  }

  async clearToolData() {
    const itens = this.messages
      .map(message => {
        const isContentArray = Array.isArray(message.content)
        if (!isContentArray) return message
        const content = message.content as Array<ContentBlockParam>
        const contentWithoutTool = content.filter(el => {
          if (el.type === 'tool_use' || el.type === 'tool_result') {
            return false
          }
          return true
        })
        return { ...message, content: contentWithoutTool }
      })
      .filter(el => Boolean(el.content) && el.content.length > 0)
    Logger.info('MCP Client', 'Clearing tool data:', itens)
    this.messages = itens
  }

  async processQuery(
    query: string,
    onMessage: (message: string) => Promise<void>,
    tracerId?: string
  ) {
    if (!tracerId) {
      tracerId = randomUUIDv7()
    }

    await this.saveMessage('user', [
      {
        type: 'text',
        text: query
      }
    ])
    Logger.info('MCP Client', 'Processing query:', query, tracerId)

    const dispatchMessage = async () => {
      try {
        const response = await this.anthropic.messages.create(
          {
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 1000,
            messages: this.messages,
            system: systemPrompt,
            tools: this.tools
          },
          {
            headers: {
              'anthropic-beta': 'token-efficient-tools-2025-02-19'
            }
          }
        )
        const fixedContent = this.fixMessageOrder(response.content)
        await this.saveMessage('assistant', fixedContent)
        for (const content of fixedContent) {
          if (content.type === 'text') {
            Logger.info('MCP Client', 'Text:', content.text, tracerId)
            await onMessage(content.text)
          } else if (content.type === 'tool_use') {
            Logger.info('MCP Client', 'Tool use:', content, tracerId)
            const toolName = content.name
            const toolUseID = content.id
            const toolInput = content.input as
              | { [x: string]: unknown }
              | undefined
            MCPServerTracerID.setTracerId(tracerId)
            const result = await this.mcp.callTool(
              {
                name: toolName,
                arguments: toolInput
              },
              undefined,
              {
                timeout: DEFAULT_REQUEST_TIMEOUT_MSEC * 2
              }
            )
            Logger.info('MCP Client', 'Tool result:', result, tracerId)
            await this.saveMessage('user', [
              {
                type: 'tool_result',
                tool_use_id: toolUseID,
                content: result.content as
                  | Array<TextBlockParam | ImageBlockParam>
                  | string
              }
            ])
          }
        }
        if (response.stop_reason !== 'end_turn') {
          await dispatchMessage()
        }
      } catch (e: unknown) {
        Logger.error('MCP Client', 'Error processing query:', e, tracerId)
        const isToolUseError =
          e instanceof Error &&
          (e.message.includes(
            '`tool_use` ids were found without `tool_result`'
          ) ||
            e.message.includes(
              '`Each `tool_result` block must have a corresponding `tool_use` block in the previous message.'
            ))
        Logger.info(
          'MCP Client',
          'Is tool use error:',
          isToolUseError,
          tracerId
        )
        if (!isToolUseError) {
          Logger.error(
            'MCP Client',
            'Error is not a tool use error, rethrowing',
            e,
            tracerId
          )
          await onMessage(
            'Ocorreu um erro ao processar a sua solicitação. Por favor, tente novamente mais tarde. Tracer ID: ' +
              tracerId
          )
        }
      }
    }
    await dispatchMessage()
    await this.clearToolData()
  }

  async loadOldMessages(): Promise<void> {
    const messages =
      await ChatbotDatabase.getInstance().getMessagesOldMessages()
    this.messages = messages.reverse().map(el => {
      return {
        role: el.role,
        content: JSON.parse(el.content)
      }
    })
    const firstMessage = this.messages[0]
    if (!firstMessage) {
      return
    }
    if (Array.isArray(firstMessage.content)) {
      const includesTool = firstMessage.content.some((el: ContentBlockParam) =>
        el.type.includes('tool')
      )
      if (includesTool) {
        this.removeVeryOldMessages()
      }
    }
    await this.clearToolData()
  }

  fixMessageOrder(message: Array<ContentBlockParam>) {
    // text should be the first element
    return message.sort((a, b) => {
      if (a.type === 'text' && b.type !== 'text') {
        return -1
      } else if (a.type !== 'text' && b.type === 'text') {
        return 1
      }
      return 0
    })
  }

  removeVeryOldMessages() {
    const firstMessage = this.messages[0]
    if (Array.isArray(firstMessage.content)) {
      const includesTool = firstMessage.content.find((el: ContentBlockParam) =>
        el.type.includes('tool_use')
      ) as ToolUseBlockParam | undefined
      if (includesTool) {
        const correspondingToolResult = this.messages.findIndex(el => {
          if (Array.isArray(el.content)) {
            return el.content.find(
              (el2: ContentBlockParam) =>
                el2.type.includes('tool_result') &&
                (el2 as ToolResultBlockParam).tool_use_id === includesTool.id
            )
          }
          return false
        })
        if (correspondingToolResult) {
          const removedMessage = this.messages.splice(
            0,
            correspondingToolResult + 1
          )
          Logger.info('MCP Client', 'Removed message:', removedMessage)
        }
      } else {
        this.messages.shift()
      }
    } else {
      this.messages.shift()
    }
  }

  async saveMessage(
    role: 'user' | 'assistant',
    message: Array<ContentBlockParam>
  ) {
    if (this.messages.length > 10) {
      this.removeVeryOldMessages()
    }

    this.messages.push({
      role: role,
      content: message
    })
    await ChatbotDatabase.getInstance().saveMessage({
      content: JSON.stringify(message),
      role: role
    })
  }

  async cleanup() {
    await this.mcp.close()
  }

  async clearMessages() {
    this.messages = []
    await ChatbotDatabase.getInstance().clearMessages()
  }
}
