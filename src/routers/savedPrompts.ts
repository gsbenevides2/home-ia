import { Elysia, t } from 'elysia'
import { SavedPromptDatabase } from '../clients/database/savedPrompts'
import { addToQueue } from '../queue/queue'
import { authService } from './authentication'

const savedPromptsRouter = new Elysia({
  prefix: '/service/saved-prompts'
})
  .use(authService)
  .get(
    '/',
    async () => {
      const savedPrompts =
        await SavedPromptDatabase.getInstance().getSavedPrompts()
      return {
        savedPrompts
      }
    },
    {
      response: t.Object({
        savedPrompts: t.Array(
          t.Object({
            id: t.String(),
            name: t.String(),
            prompt: t.String()
          })
        )
      }),
      requireAuthentication: true
    }
  )
  .post(
    '/',
    async ({ body }) => {
      const savedPrompt =
        await SavedPromptDatabase.getInstance().createSavedPrompt(body)
      return {
        savedPrompt
      }
    },
    {
      body: t.Object({
        name: t.String(),
        prompt: t.String()
      }),
      requireAuthentication: true
    }
  )
  .delete(
    '/:id',
    async ({ params }) => {
      await SavedPromptDatabase.getInstance().deleteSavedPrompt(params.id)
      return {
        message: 'Saved prompt deleted'
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      requireAuthentication: true
    }
  )
  .put(
    '/:id',
    async ({ params, body }) => {
      await SavedPromptDatabase.getInstance().updateSavedPrompt(params.id, body)
      return {
        message: 'Saved prompt updated'
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.String(),
        prompt: t.String()
      }),
      requireAuthentication: true
    }
  )
  .post(
    '/:id/execute',
    async context => {
      const prompt = await SavedPromptDatabase.getInstance().getSavedPrompt(
        context.params.id
      )

      if (!prompt) {
        return context.status(404, {
          message: 'Saved prompt not found'
        })
      }

      let promptText = prompt.prompt ?? ''
      const contents: string[] = (context.body?.contents ?? []).filter(
        (content: string) => content !== ''
      )
      contents.forEach((content, index) => {
        promptText = promptText.replace(`{{content[${index}]}}`, content)
      })

      addToQueue('execute-saved-prompt', {
        prompt: promptText
      })

      return context.status(200, {
        message: 'Saved prompt executed'
      })
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        contents: t.Array(t.String())
      }),
      response: {
        200: t.Object({
          message: t.String()
        }),
        404: t.Object({
          message: t.String()
        })
      },
      requireAuthentication: true
    }
  )

export default savedPromptsRouter
