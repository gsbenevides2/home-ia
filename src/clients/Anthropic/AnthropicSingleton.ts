import Anthropic from '@anthropic-ai/sdk'

const systemPromptText = await Bun.file('src/systemPromptText.txt').text()
const systemPromptVoice = await Bun.file('src/systemPromptVoice.txt').text()

export class AnthropicSingleton {
  private static instance: Anthropic
  private constructor() {}

  public static async getInstance(): Promise<Anthropic> {
    if (AnthropicSingleton.instance) return AnthropicSingleton.instance
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    AnthropicSingleton.instance = new Anthropic({
      apiKey
    })

    return AnthropicSingleton.instance
  }

  static model = 'claude-3-5-haiku-20241022'
  static systemPromptForText: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: systemPromptText,
      cache_control: { type: 'ephemeral' }
    }
  ]

  static systemPromptForVoice: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: systemPromptVoice,
      cache_control: { type: 'ephemeral' }
    }
  ]
  static maxTokens = 1000
}
