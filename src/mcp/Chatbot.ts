import type {
  ImageBlockParam,
  MessageParam,
  TextBlockParam
} from '@anthropic-ai/sdk/resources/index.mjs'
import { AnthropicSingleton } from '../clients/AnthropicSingleton'
import { ChatbotDatabase } from '../clients/database/Chatbot'
import type { Tracer } from '../logger/Tracer'
import { MCPClientSingleton } from './client'

export class Chatbot {
  private messages: MessageParam[] = []

  constructor(private readonly useDatabase: boolean = false) {}

  async init() {
    if (this.useDatabase) {
      await this.readMessagesFromDatabase()
    }
  }

  async saveMessage(message: MessageParam) {
    this.messages.push(message)
    if (this.useDatabase) {
      await ChatbotDatabase.getInstance().saveMessage({
        role: message.role,
        content: JSON.stringify(message.content)
      })
    }
  }

  async processQuery(
    query?: string,
    onMessage?: (message: string) => Promise<void>,
    tracer?: Tracer
  ) {
    tracer?.setProgram('chatbot')
    const anthropic = await AnthropicSingleton.getInstance()
    const { client: mcpClient, tools: mcpTools } =
      await MCPClientSingleton.getInstance()

    const anthropicTools = mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }))
    if (query) {
      await this.saveMessage({
        role: 'user',
        content: [{ type: 'text', text: query }]
      })
    }
    tracer?.info('Sending messages to Anthropic', {
      messages: JSON.stringify(this.messages)
    })
    const response = await anthropic.messages.create({
      model: AnthropicSingleton.model,
      messages: this.messages,
      max_tokens: AnthropicSingleton.maxTokens,
      system: AnthropicSingleton.systemPrompt,
      tools: anthropicTools
    })
    tracer?.info('Received response from Anthropic', {
      response: JSON.stringify(response)
    })
    await this.saveMessage({
      role: response.role,
      content: response.content
    })
    const textMessages = response.content.filter(
      content => content.type === 'text'
    )
    const toolMessages = response.content.filter(
      content => content.type === 'tool_use'
    )
    for (const content of textMessages) {
      if (onMessage) {
        tracer?.info('Sending message to onMessage', { message: content.text })
        await onMessage(content.text)
      }
    }
    for (const content of toolMessages) {
      const toolName = content.name
      const toolUseID = content.id
      const toolInput = content.input as { [x: string]: unknown } | undefined
      tracer?.info('Calling tool', { toolName, toolUseID, toolInput })
      tracer?.setGlobalTracerID()
      const toolResult = await mcpClient.callTool(
        {
          name: toolName,
          arguments: toolInput
        },
        undefined,
        {
          maxTotalTimeout: MCPClientSingleton.timeout,
          timeout: MCPClientSingleton.timeout
        }
      )
      tracer?.unsetGlobalTracerID()
      tracer?.info('Tool result', { toolResult })
      const toolResultContent = toolResult.content as
        | Array<TextBlockParam | ImageBlockParam>
        | string
      tracer?.info('Saving tool result', { toolResultContent })
      await this.saveMessage({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseID,
            content: toolResultContent
          }
        ]
      })
    }

    if (response.stop_reason === 'tool_use') {
      await this.processQuery(undefined, onMessage)
      tracer?.info('Cleaning up process')
      await this.cleanUpProcess()
    } else {
      tracer?.info('Cleaning up process')
      await this.cleanUpProcess()
    }
  }

  private removeToolBlocks() {
    this.messages = this.messages
      .map(message => {
        let content = message.content
        if (content instanceof Array) {
          content = content.filter(
            content =>
              content.type !== 'tool_use' && content.type !== 'tool_result'
          ) as Array<TextBlockParam | ImageBlockParam>
        }
        return {
          ...message,
          content
        }
      })
      .filter(message => message.content.length > 0)
  }

  private async readMessagesFromDatabase() {
    const messages =
      await ChatbotDatabase.getInstance().getMessagesOldMessages()
    this.messages = messages.map(message => ({
      role: message.role,
      content: JSON.parse(message.content)
    }))
    this.removeToolBlocks()
  }

  private removeOldMessages() {
    if (this.messages.length > 5) {
      this.messages = this.messages.slice(this.messages.length - 5)
    }
  }

  async cleanUpProcess() {
    this.removeToolBlocks()
    this.removeOldMessages()
  }
}

export class DiscordChatbot {
  private static instance: Chatbot

  public static async getInstance(): Promise<Chatbot> {
    if (!DiscordChatbot.instance) {
      const chatbot = new Chatbot(true)
      await chatbot.init()
      DiscordChatbot.instance = chatbot
    }
    return DiscordChatbot.instance
  }
}
