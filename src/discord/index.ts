import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { Logger } from '../logger/index.ts'
import { Tracer } from '../logger/Tracer.ts'
import { DiscordChatbot } from '../mcp/Chatbot.ts'
export class DiscordBot {
  private client: Client
  private static instance: DiscordBot

  public static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot()
    }
    return DiscordBot.instance
  }

  private constructor() {
    const DISCORD_ALLOWED_USER_ID = Bun.env.DISCORD_ALLOWED_USER_ID
    const DISCORD_BOT_ID = Bun.env.DISCORD_BOT_ID
    if (!DISCORD_ALLOWED_USER_ID) {
      throw new Error('DISCORD_ALLOWED_USER_ID is not set')
    }
    if (!DISCORD_BOT_ID) {
      throw new Error('DISCORD_BOT_ID is not set')
    }
    this.client = new Client({
      intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ],
      partials: [Partials.Channel, Partials.Message]
    })

    this.client.on('ready', () => {
      Logger.info('Discord Bot', 'Bot is connected to Discord', null)
    })

    this.client.on('messageCreate', async message => {
      const chatbot = await DiscordChatbot.getInstance()
      const tracer = new Tracer()
      tracer.setProgram('Discord Bot')
      const authorId = message.author.id
      const content = message.content
      if (authorId === DISCORD_BOT_ID) {
        return
      }
      if (authorId !== DISCORD_ALLOWED_USER_ID) {
        message.reply('Você não tem permissão para usar este bot.')
        return
      }
      tracer.info('Message received from user', {
        authorId,
        message
      })
      chatbot
        .processQuery(
          content,
          async response => {
            if (response.length > 2000) {
              const lines = response.split('\n')
              const linesBlock = lines.reduce(
                (acc, line) => {
                  const lastBlock = acc[acc.length - 1]
                  if (lastBlock.length + line.length > 2000) {
                    acc.push(line)
                  } else {
                    acc[acc.length - 1] += line
                  }
                  return acc
                },
                ['']
              )
              for (const block of linesBlock) {
                tracer.info('Sending message to user', {
                  message: block
                })
                await message.author.send(block)
              }
            } else {
              tracer.info('Sending message to user', {
                message: response
              })
              await message.author.send(response)
            }
          },
          tracer
        )
        .catch(error => {
          tracer.error('Error processing query', {
            error
          })
          message.reply(
            'Ocorreu um erro ao processar a consulta. Por favor, tente novamente mais tarde.'
          )
        })
    })
  }

  async connect() {
    const DISCORD_TOKEN = Bun.env.DISCORD_TOKEN
    if (!DISCORD_TOKEN) {
      Logger.error('Discord Bot', 'DISCORD_TOKEN is not set')
      throw new Error('DISCORD_TOKEN is not set')
    }
    Logger.info('Discord Bot', 'Logging in to Discord')
    await this.client.login(DISCORD_TOKEN)
  }

  async sendMessage(message: string) {
    const DISCORD_ALLOWED_USER_ID = Bun.env.DISCORD_ALLOWED_USER_ID
    if (!DISCORD_ALLOWED_USER_ID) {
      throw new Error('DISCORD_ALLOWED_USER_ID is not set')
    }
    const user = await this.client.users.fetch(DISCORD_ALLOWED_USER_ID)
    if (!user) {
      throw new Error('DISCORD_ALLOWED_USER_ID is not set')
    }
    await user.send(message)
  }

  async disconnect() {
    await this.client.destroy()
  }
}
