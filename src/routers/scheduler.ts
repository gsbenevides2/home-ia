import { Elysia, t } from 'elysia'
import { AiScheduller } from '../scheduller/AiScheduler'
import { authService } from './authentication'

const schedulerRouter = new Elysia({
  prefix: '/api/scheduler'
})
  .use(authService)
  .get(
    '/jobs',
    async () => {
      const jobs = await AiScheduller.getJobs()
      return jobs
    },
    {
      requireAuthentication: true
    }
  )
  .get(
    '/jobs/:id',
    async context => {
      const { id } = context.params
      const job = await AiScheduller.getJob(id)

      if (!job) {
        return context.status(404, { error: 'Job não encontrado' })
      }

      return job
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        404: t.Object({
          error: t.String()
        })
      },
      requireAuthentication: true
    }
  )
  .post(
    '/jobs',
    async context => {
      const { type, time, llm, exclude } = context.body
      const jobId = await AiScheduller.scheduleJob({ type, time, llm, exclude })

      return context.status(201, { id: jobId, type, time, llm, exclude })
    },
    {
      body: t.Object({
        type: t.Union([t.Literal('cron'), t.Literal('date')]),
        time: t.String(),
        llm: t.String(),
        exclude: t.Boolean()
      }),
      response: {
        201: t.Object({
          id: t.String(),
          type: t.Union([t.Literal('cron'), t.Literal('date')]),
          time: t.String(),
          llm: t.String(),
          exclude: t.Boolean()
        })
      },
      requireAuthentication: true
    }
  )
  .put(
    '/jobs/:id',
    async context => {
      const { id } = context.params
      const updateData = context.body

      const updatedJob = await AiScheduller.changeJob(id, updateData)

      if (!updatedJob) {
        return context.status(404, { error: 'Job não encontrado' })
      }

      return updatedJob
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        type: t.Optional(t.Union([t.Literal('cron'), t.Literal('date')])),
        time: t.Optional(t.String()),
        llm: t.Optional(t.String()),
        exclude: t.Optional(t.Boolean())
      }),
      response: {
        404: t.Object({
          error: t.String()
        })
      },
      requireAuthentication: true
    }
  )
  .delete(
    '/jobs/:id',
    async context => {
      const { id } = context.params
      await AiScheduller.deleteJob(id)

      return context.status(204)
    },
    {
      params: t.Object({
        id: t.String()
      }),
      requireAuthentication: true
    }
  )

export default schedulerRouter
