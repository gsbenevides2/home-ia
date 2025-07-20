import { Elysia, t } from 'elysia'

const envUserName = Bun.env.LOGIN_USERNAME
const envPassword = Bun.env.LOGIN_PASSWORD
export const envAuthToken = Bun.env.AUTH_TOKEN

const authenticationRouter = new Elysia()
  .post(
    '/login',
    context => {
      const { username, password } = context.body

      if (username === envUserName && password === envPassword) {
        context.set.headers['set-cookie'] =
          `authorization=Bearer ${envAuthToken}`
        return context.status(200, {
          status: 'Login successful'
        })
      }

      return context.status(401, {
        status: 'Unauthorized'
      })
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String()
      }),
      response: {
        200: t.Object({
          status: t.String()
        }),
        401: t.Object({
          status: t.String()
        })
      }
    }
  )
  .get(
    '/is-authenticated',
    context => {
      const authorizationCookie = context.cookie.authorization?.value
      if (authorizationCookie === `Bearer ${envAuthToken}`) {
        return context.status(200, {
          status: 'Authenticated'
        })
      }

      return context.status(401, {
        status: 'Unauthorized'
      })
    },
    {
      response: {
        200: t.Object({
          status: t.String()
        }),
        401: t.Object({
          status: t.String()
        })
      }
    }
  )

export const authService = new Elysia({
  name: 'Auth.service'
}).macro({
  requireAuthentication: {
    resolve: context => {
      let finalDecision = false
      const authorizationCookie = context.cookie.authorization?.value
      if (authorizationCookie === `Bearer ${envAuthToken}`) {
        finalDecision = true
      }

      if (!finalDecision) {
        return context.status(401, {
          status: 'Unauthorized'
        })
      }
      return context
    }
  }
})

export default authenticationRouter
