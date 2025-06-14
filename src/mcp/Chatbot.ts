import type { AnthropicError } from '@anthropic-ai/sdk'
import type { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream.mjs'
import type {
  ContentBlockParam,
  ImageBlockParam,
  MessageParam,
  TextBlockParam,
  ToolUnion
} from '@anthropic-ai/sdk/resources/index.mjs'
import { randomUUIDv7 } from 'bun'
import { AnthropicSingleton } from '../clients/Anthropic/AnthropicSingleton'
import { prepareImageToSendToAnthropic } from '../clients/Anthropic/prepareImageToSendToAnthropic'
import { ChatbotDatabase } from '../clients/database/Chatbot'
import { GoogleCloudStorage } from '../clients/google/CloudStorage'
import type { Tracer } from '../logger/Tracer'
import { cathable } from '../utils/cathable'
import { MCPStreamableClientSingleton } from './client/streamable'
import type { Content } from './tool/AbstractTool'

type MessageType = 'system' | 'content'
type MessageSender = (type: MessageType, message: string) => Promise<void>

type MessageSenderFactory = (
  type: MessageType,
  initialMessage: string
) => MessageSenderPromise

type MessageSenderPromise = Promise<MessageSenderReturnPromise>

type MessageSenderReturnPromise = {
  sendPartialMessage: MessageSender
  sendFinalMessage: MessageSender
  sendMessage: MessageSender
  cleanup: () => void
}

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

  async blockInteraction(interactionId: string) {
    if (this.useDatabase) {
      await ChatbotDatabase.getInstance().blockInteraction(interactionId)
    }
  }

  async getMcpData() {
    const { client: mcpClient, tools: mcpTools } =
      await MCPStreamableClientSingleton.getInstance()
    const anthropicTools: ToolUnion[] = mcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }))

    anthropicTools.push({
      type: 'web_search_20250305' as any,
      name: 'web_search' as any
    })
    return {
      mcpClient,
      anthropicTools
    }
  }

  async processQuery(
    query?: string,
    getMessageSender?: MessageSenderFactory | MessageSenderReturnPromise,
    tracer?: Tracer,
    paramInteractionId?: string,
    continueFromPreviousInteraction?: boolean,
    imagesUrls?: string[]
  ) {
    let messageSender: MessageSenderReturnPromise | undefined = undefined

    if (typeof getMessageSender === 'function') {
      const sender = await getMessageSender('content', 'Aguarde um momento...')
      messageSender = sender
    } else if (
      getMessageSender &&
      typeof getMessageSender === 'object' &&
      'sendPartialMessage' in getMessageSender
    ) {
      messageSender = await getMessageSender
    }

    const interactionId = paramInteractionId ?? randomUUIDv7()
    tracer?.setProgram('chatbot')
    const anthropic = await AnthropicSingleton.getInstance()
    const { mcpClient, anthropicTools } = await this.getMcpData()

    if (query) {
      const content: ContentBlockParam[] = [
        {
          type: 'text',
          text: query
        }
      ]
      if (imagesUrls && imagesUrls.length > 0) {
        messageSender?.sendPartialMessage('content', 'Otimizando imagens...')
        const imagesBlockPromise = Promise.all<ContentBlockParam>(
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
        const imageBlocks = await imagesBlockPromise.catch(error => {
          tracer?.error('Error on image optimization', { error })
          messageSender?.sendFinalMessage(
            'system',
            'Ocorreu um erro ao otimizar as imagens, por favor, tente novamente mais tarde.\nRastreabilidade: ' +
              tracer?.getID()
          )
          return []
        })
        if (imageBlocks.length === 0) {
          return
        }
        content.push(...imageBlocks)
      }
      await this.saveMessage({
        role: 'user',
        content,
        interactionId
      })
    }
    tracer?.info('Sending messages to Anthropic', {
      messages: this.messages
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
      if (messageSender) {
        messageSender.cleanup()
      }
    }

    const textMessages = response.content.filter(
      content => content.type === 'text'
    )
    const toolMessages = response.content.filter(
      content => content.type === 'tool_use'
    )
    for (const content of textMessages) {
      if (messageSender) {
        tracer?.info('Sending message to onMessage', { message: content.text })
        if (messageSender) {
          await messageSender.sendMessage('content', content.text)
        }
      }
    }
    const stopReason = response.stop_reason

    if (stopReason === 'max_tokens') {
      if (messageSender) {
        await messageSender.sendFinalMessage(
          'system',
          'Quantidade máxima de tokens atingida'
        )
      }
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
      await this.processQuery(
        undefined,
        messageSender,
        tracer,
        interactionId,
        true
      )
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
    const { mcpClient, anthropicTools } = await this.getMcpData()

    const messageSender = getMessageSender
      ? await getMessageSender('content', 'Aguarde um momento...')
      : undefined

    if (query) {
      const content: ContentBlockParam[] = [
        {
          type: 'text',
          text: query
        }
      ]
      if (imagesUrls && imagesUrls.length > 0) {
        messageSender?.sendPartialMessage('content', 'Otimizando imagens...')
        const imagesBlockPromise = Promise.all<ContentBlockParam>(
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
        const imageBlocks = await imagesBlockPromise.catch(error => {
          tracer?.error('Error on image optimization', { error })
          messageSender?.sendFinalMessage(
            'system',
            'Ocorreu um erro ao otimizar as imagens, por favor, tente novamente mais tarde.\nRastreabilidade: ' +
              tracer?.getID()
          )
          return []
        })
        if (imageBlocks.length === 0) {
          return
        }
        content.push(...imageBlocks)
      }
      await this.saveMessage({
        role: 'user',
        content,
        interactionId
      })
    }
    tracer?.info('Sending messages to Anthropic', {
      messages: this.messages
    })
    messageSender?.sendPartialMessage('content', 'Só mais um momento...')

    const endProcess = async (stream: MessageStream | null) => {
      if (!continueFromPreviousInteraction) {
        await this.cleanUpProcess()
      }
      if (stream) {
        await stream.done()
      }
    }
    const errorHandler = async (error: AnthropicError | Error) => {
      tracer?.error('Error on stream', { error })
      if (error.name === 'overloaded_error') {
        messageSender?.sendFinalMessage(
          'system',
          'A API do Anthropic está sobrecarregada, por favor, tente novamente mais tarde.\nRastreabilidade: ' +
            tracer?.getID()
        )
      } else if (error.name === 'request_too_large') {
        messageSender?.sendFinalMessage(
          'system',
          'A mensagem é muito grande, por favor, tente novamente com uma mensagem menor. Pode ser que que a resposta da ferramenta seja muito grande para ser enviada de volta para Anthropic.' +
            '\nRastreabilidade: ' +
            tracer?.getID()
        )
      } else {
        messageSender?.sendFinalMessage(
          'system',
          'Ocorreu um erro na nossa comunicação com o Anthropic, por favor, tente novamente mais tarde.\nRastreabilidade: ' +
            tracer?.getID()
        )
      }
      await this.blockInteraction(interactionId)
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
      await errorHandler(error)
      return await endProcess(stream)
    })
    stream.on('text', (_, textSnapshot) => {
      if (messageSender) {
        messageSender.sendPartialMessage('content', textSnapshot)
      }
    })
    stream.on('finalMessage', async message => {
      const textMessages = message.content.filter(
        content => content.type === 'text'
      )
      const finalText = textMessages.map(content => content.text).join('')
      if (messageSender) {
        await messageSender.sendFinalMessage('content', finalText)
      }
      await this.saveMessage({
        role: message.role,
        content: message.content,
        interactionId
      })
      const stopReason = message.stop_reason

      if (stopReason === 'max_tokens') {
        if (!getMessageSender) return await endProcess(stream)
        messageSender?.sendFinalMessage(
          'system',
          'Ocorreu um erro ao se comunicar com o Anthropic: Quantidade máxima de tokens atingida.\nRastreabilidade: ' +
            tracer?.getID()
        )
        await this.blockInteraction(interactionId)
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
          const toolResultContent = toolResult.content as Content[]

          tracer?.info('Saving tool result', { toolResultContent })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseID,
            content: toolResultContent.map<TextBlockParam | ImageBlockParam>(
              content => {
                if (content.type === 'text') {
                  const textBlock: TextBlockParam = {
                    type: 'text',
                    text: content.text
                  }
                  return textBlock
                } else if (content.type === 'image') {
                  const imageBlock: ImageBlockParam = {
                    type: 'image',
                    source: {
                      type: 'base64' as const,
                      data: content.data,
                      media_type: content.mimeType
                    }
                  }
                  return imageBlock
                }
                return {
                  type: 'text',
                  text: 'Erro ao processar o resultado da ferramenta'
                }
              }
            )
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
    if (!this.useDatabase) return []
    const messages =
      await ChatbotDatabase.getInstance().getMessagesOldMessages()

    const toolUseMessages = messages.flatMap(message => {
      const toolBlockParam = message.content.filter(
        content => content.type === 'tool_use'
      )
      return toolBlockParam.map(tool => ({
        pkId: message.pkId,
        tooluId: tool.id
      }))
    })
    const toolResultsMessages = messages.flatMap(message => {
      const toolBlockParam = message.content.filter(
        content => content.type === 'tool_result'
      )
      return toolBlockParam.map(tool => ({
        pkId: message.pkId,
        tooluId: tool.tool_use_id
      }))
    })
    const messagesWithoutToolUseResult = toolUseMessages.filter(message => {
      const toolResult = toolResultsMessages.find(
        toolResult => toolResult.tooluId === message.tooluId
      )
      return !toolResult
    })

    for (const message of messagesWithoutToolUseResult) {
      const removedToolUseBlock = messages.find(
        message => message.pkId === message.pkId
      )
      if (removedToolUseBlock) {
        removedToolUseBlock.content = removedToolUseBlock.content.filter(
          content => {
            if (content.type !== 'tool_use') return true
            return content.id !== message.tooluId
          }
        )
        await ChatbotDatabase.getInstance().editSpecificMessage({
          id: removedToolUseBlock.pkId,
          content: removedToolUseBlock.content
        })
      }
    }
    if (messagesWithoutToolUseResult.length > 0) {
      await this.readMessagesFromDatabase()
      return
    }

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
