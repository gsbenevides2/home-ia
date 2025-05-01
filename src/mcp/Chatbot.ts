import type { AnthropicError } from '@anthropic-ai/sdk'
import type { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream.mjs'
import type {
  ContentBlockParam,
  ImageBlockParam,
  MessageParam,
  TextBlockParam
} from '@anthropic-ai/sdk/resources/index.mjs'
import { randomUUIDv7 } from 'bun'
import { AnthropicSingleton } from '../clients/Anthropic/AnthropicSingleton'
import { prepareImageToSendToAnthropic } from '../clients/Anthropic/prepareImageToSendToAnthropic'
import { ChatbotDatabase } from '../clients/database/Chatbot'
import { GoogleCloudStorage } from '../clients/google/CloudStorage'
import type { Tracer } from '../logger/Tracer'
import { cathable } from '../utils/cathable'
import { MCPStreamableClientSingleton } from './client/streamable'

type MessageSender = (message: string) => Promise<void>

type MessageSenderFactory = (initialMessage: string) => Promise<{
  sendPartialMessage: MessageSender
  sendFinalMessage: MessageSender
  cleanup: () => void
}>

export interface ChatbotMessage {
  role: MessageParam['role']
  content: MessageParam['content']
  interactionId: string
}

export class Chatbot {
  private messages: ChatbotMessage[] = []

  constructor(private readonly useDatabase: boolean = false) {}

  async init() {
    if (this.useDatabase) {
      await this.readMessagesFromDatabase()
    }
  }

  async saveMessage(message: ChatbotMessage) {
    this.messages.push(message)
    if (this.useDatabase) {
      await ChatbotDatabase.getInstance().saveMessage({
        role: message.role,
        content: message.content as ContentBlockParam[],
        interactionId: message.interactionId
      })
    }
  }

  async processQuery(
    query?: string,
    onMessage?: (message: string) => Promise<void>,
    tracer?: Tracer,
    paramInteractionId?: string,
    continueFromPreviousInteraction?: boolean
  ) {
    const interactionId = paramInteractionId ?? randomUUIDv7()
    tracer?.setProgram('chatbot')
    const anthropic = await AnthropicSingleton.getInstance()
    const { client: mcpClient, tools: mcpTools } =
      await MCPStreamableClientSingleton.getInstance()

    const anthropicTools = mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }))
    if (query) {
      await this.saveMessage({
        role: 'user',
        content: [{ type: 'text', text: query }],
        interactionId
      })
    }
    tracer?.info('Sending messages to Anthropic', {
      messages: JSON.stringify(this.messages)
    })
    const response = await anthropic.messages.create({
      model: AnthropicSingleton.model,
      messages: this.remakeMessagesListToAnthropicFormat(),
      max_tokens: AnthropicSingleton.maxTokens,
      system: AnthropicSingleton.systemPrompt,
      tools: anthropicTools
    })
    tracer?.info('Received response from Anthropic', {
      response: JSON.stringify(response)
    })
    await this.saveMessage({
      role: response.role,
      content: response.content,
      interactionId
    })

    const endProcess = async () => {
      if (!continueFromPreviousInteraction) {
        await this.cleanUpProcess()
      }
    }

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
    const stopReason = response.stop_reason

    if (stopReason === 'max_tokens') {
      if (onMessage) await onMessage('Quantidade máxima de tokens atingida')
      return await endProcess()
    }

    if (stopReason === 'tool_use') {
      const toolResults: ContentBlockParam[] = []
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
            maxTotalTimeout: MCPStreamableClientSingleton.timeout,
            timeout: MCPStreamableClientSingleton.timeout
          }
        )
        tracer?.unsetGlobalTracerID()
        tracer?.info('Tool result', { toolResult })
        const toolResultContent = toolResult.content as
          | Array<TextBlockParam | ImageBlockParam>
          | string
        tracer?.info('Saving tool result', { toolResultContent })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUseID,
          content: toolResultContent
        })
      }
      await this.saveMessage({
        role: 'user',
        content: toolResults,
        interactionId
      })
      await this.processQuery(undefined, onMessage, tracer, interactionId, true)
      return await endProcess()
    }
    return await endProcess()
  }

  async processQueryWithStream(
    query?: string,
    getMessageSender?: MessageSenderFactory,
    tracer?: Tracer,
    paramInteractionId?: string,
    continueFromPreviousInteraction?: boolean,
    imagesUrls?: string[]
  ) {
    const interactionId = paramInteractionId ?? randomUUIDv7()
    tracer?.setProgram('chatbot')

    const anthropic = await AnthropicSingleton.getInstance()
    const { client: mcpClient, tools: mcpTools } =
      await MCPStreamableClientSingleton.getInstance()

    const messageSender = getMessageSender
      ? await getMessageSender('Processando...')
      : undefined

    const anthropicTools = mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }))
    if (query) {
      const content: ContentBlockParam[] = [
        {
          type: 'text',
          text: query
        }
      ]
      if (imagesUrls && imagesUrls.length > 0) {
        messageSender?.sendPartialMessage('Otimizando imagens...')
        const imageBlocks: ContentBlockParam[] = await Promise.all(
          imagesUrls.map(async url => {
            const { data } = await prepareImageToSendToAnthropic(url)
            const imageUrl = await GoogleCloudStorage.getInstance().uploadFile(
              data,
              `ai/${randomUUIDv7()}.jpeg`,
              'gui-dev-br.appspot.com'
            )
            return {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl
              }
            }
          })
        )
        content.push(...imageBlocks)
      }
      await this.saveMessage({
        role: 'user',
        content,
        interactionId
      })
    }
    tracer?.info('Sending messages to Anthropic', {
      messages: JSON.stringify(this.messages)
    })
    messageSender?.sendPartialMessage('Pensando...')

    const endProcess = async (stream: MessageStream | null) => {
      if (!continueFromPreviousInteraction) {
        await this.cleanUpProcess()
      }
      if (stream) {
        await stream.done()
      }
    }
    const errorHandler = (error: AnthropicError | Error) => {
      if (error.name === 'overloaded_error') {
        messageSender?.sendFinalMessage(
          'A API do Anthropic está sobrecarregada, por favor, tente novamente mais tarde. TracerId: ' +
            tracer?.getID()
        )
      } else if (error.name === 'request_too_large') {
        messageSender?.sendFinalMessage(
          'A mensagem é muito grande, por favor, tente novamente com uma mensagem menor. Pode ser que que a resposta da ferramenta seja muito grande para ser enviada de volta para Anthropic.' +
            'TracerId: ' +
            tracer?.getID()
        )
      } else {
        messageSender?.sendFinalMessage(
          'Ocorreu um erro, por favor, tente novamente mais tarde. TracerId: ' +
            tracer?.getID()
        )
      }
    }
    const stream = await cathable(() =>
      anthropic.messages.stream({
        messages: this.remakeMessagesListToAnthropicFormat(),
        model: AnthropicSingleton.model,
        max_tokens: AnthropicSingleton.maxTokens,
        system: AnthropicSingleton.systemPrompt,
        tools: anthropicTools
      })
    ).catch(errorHandler)
    if (!stream) {
      return await endProcess(null)
    }

    stream.on('error', async error => {
      errorHandler(error)
      return await endProcess(stream)
    })
    stream.on('text', (_, textSnapshot) => {
      if (messageSender) {
        messageSender.sendPartialMessage(textSnapshot)
      }
    })
    stream.on('finalMessage', async message => {
      const textMessages = message.content.filter(
        content => content.type === 'text'
      )
      const finalText = textMessages.map(content => content.text).join('')
      if (messageSender) {
        await messageSender.sendFinalMessage(finalText)
      }
      await this.saveMessage({
        role: message.role,
        content: message.content,
        interactionId
      })
      const stopReason = message.stop_reason

      if (stopReason === 'max_tokens') {
        if (!getMessageSender) return await endProcess(stream)
        const messageSender = await getMessageSender(
          'Quantidade máxima de tokens atingida'
        )
        await messageSender.sendFinalMessage(
          'Quantidade máxima de tokens atingida'
        )
        return await endProcess(stream)
      }
      if (stopReason === 'tool_use') {
        if (!getMessageSender) return await endProcess(stream)
        const tools = message.content.filter(
          content => content.type === 'tool_use'
        )
        const toolResults: ContentBlockParam[] = []
        for (const tool of tools) {
          const toolName = tool.name
          const toolUseID = tool.id
          const toolInput = tool.input as { [x: string]: unknown } | undefined
          tracer?.info('Calling tool', { toolName, toolUseID, toolInput })
          tracer?.setGlobalTracerID()
          const toolResult = await mcpClient.callTool(
            {
              name: toolName,
              arguments: toolInput
            },
            undefined,
            {
              maxTotalTimeout: MCPStreamableClientSingleton.timeout,
              timeout: MCPStreamableClientSingleton.timeout
            }
          )
          tracer?.unsetGlobalTracerID()
          tracer?.info('Tool result', { toolResult })
          const toolResultContent = toolResult.content as
            | Array<TextBlockParam | ImageBlockParam>
            | string
          tracer?.info('Saving tool result', { toolResultContent })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseID,
            content: toolResultContent
          })
        }
        await this.saveMessage({
          role: 'user',
          content: toolResults,
          interactionId
        })
        await this.processQueryWithStream(
          undefined,
          getMessageSender,
          tracer,
          interactionId,
          true
        )
        return await endProcess(stream)
      }
    })
  }

  remakeMessagesListToAnthropicFormat(): MessageParam[] {
    return this.messages.map(message => ({
      role: message.role,
      content: message.content
    }))
  }

  private async readMessagesFromDatabase() {
    const messages =
      await ChatbotDatabase.getInstance().getMessagesOldMessages()
    this.messages = messages.reverse().map(message => ({
      role: message.role,
      content: message.content,
      interactionId: message.interactionId
    }))
  }

  async cleanUpProcess() {
    this.messages = []
    await this.readMessagesFromDatabase()
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
