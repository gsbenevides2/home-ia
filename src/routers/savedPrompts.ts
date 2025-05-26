import { Router } from 'express'
import { SavedPromptDatabase } from '../clients/database/savedPrompts'
import { addToQueue } from '../queue/queue'

const savedPromptsRouter = Router()

savedPromptsRouter.get('/service/saved-prompts', async (_, res) => {
  const prompts = await SavedPromptDatabase.getInstance().getSavedPrompts()
  res.json(prompts)
})

savedPromptsRouter.post('/service/saved-prompts', async (req, res) => {
  const prompt = await SavedPromptDatabase.getInstance().createSavedPrompt(
    req.body
  )
  res.json(prompt)
})

savedPromptsRouter.delete('/service/saved-prompts/:id', async (req, res) => {
  await SavedPromptDatabase.getInstance().deleteSavedPrompt(req.params.id)
  res.json({ message: 'Prompt deleted' })
})

savedPromptsRouter.put('/service/saved-prompts/:id', async (req, res) => {
  await SavedPromptDatabase.getInstance().updateSavedPrompt(
    req.params.id,
    req.body
  )
  res.json({ message: 'Prompt updated' })
})

savedPromptsRouter.get('/service/saved-prompts/:id', async (req, res) => {
  const prompt = await SavedPromptDatabase.getInstance().getSavedPrompt(
    req.params.id
  )
  res.json(prompt)
})

savedPromptsRouter.post(
  '/service/saved-prompts/:id/execute',
  async (req, res) => {
    const prompt = await SavedPromptDatabase.getInstance().getSavedPrompt(
      req.params.id
    )

    if (!prompt) {
      res.status(404).json({ message: 'Prompt not found' })
      return
    }

    let promptText = prompt.prompt ?? ''
    const contents: string[] = req.body?.contents ?? []
    contents.forEach((content, index) => {
      promptText = promptText.replace(`{{content[${index}]}}`, content)
    })
    addToQueue('execute-saved-prompt', {
      prompt: promptText
    })

    res.json({ message: 'Prompt enqueued in executation pipeline' })
  }
)

export default savedPromptsRouter
