import { Chatbot } from '../../mcp/Chatbot'

export async function executeSavedPrompt(data: Record<string, unknown>) {
  const prompt = data.prompt as string
  const chatbot = new Chatbot(false)
  await chatbot.init()
  await chatbot.processQuery(prompt)
}
