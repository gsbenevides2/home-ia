import Elysia, { t } from 'elysia'
import {
  addToQueue,
  publicOperations,
  type PublicOperations
} from '../queue/queue'
import { authService } from './authentication'

const typedPublicOperationsObj = publicOperations.reduce(
  (acc, operation) => {
    acc[operation] = t.Never()
    return acc
  },
  {} as Record<PublicOperations, ReturnType<typeof t.Never>>
)

const queueRouter = new Elysia().use(authService).post(
  '/queue',
  context => {
    const { operations } = context.body
    operations.forEach(operation => {
      addToQueue(operation)
    })
    return { message: 'Operations received' }
  },
  {
    body: t.Object({
      operations: t.Array(t.KeyOf(t.Object(typedPublicOperationsObj)))
    }),
    requireAuthentication: true
  }
)

export default queueRouter
