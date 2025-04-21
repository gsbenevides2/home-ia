import Anthropic from '@anthropic-ai/sdk'

const systemPrompt = await Bun.file('src/systemPrompt.txt').text()

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
  static systemPrompt: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }
    }
  ]
  static maxTokens = 1000
}
