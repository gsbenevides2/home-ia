import Elysia from 'elysia'
import { OauthClient } from '../clients/google/OauthClient'
import {
  OAUTH_ERROR_URI_PATHNAME,
  OAUTH_SUCCESS_URI_PATHNAME
} from '../clients/google/OauthClient/constants'
import { authService } from './authentication'

const oauthClient = OauthClient.getInstance()

const googleOauthRouter = new Elysia()
  .use(authService)
  .get(
    oauthClient.staterUrl.pathname,
    async () => {
      const response = await oauthClient.handleOauthUrl()
      return response
    },
    {
      requireAuthentication: true
    }
  )
  .get(
    oauthClient.redirectUri.pathname,
    async context => {
      try {
        await oauthClient.handleOauthRedirect(context.request)
        return context.redirect(OAUTH_SUCCESS_URI_PATHNAME, 302)
      } catch {
        return context.redirect(OAUTH_ERROR_URI_PATHNAME, 302)
      }
    },
    {
      requireAuthentication: true
    }
  )

export default googleOauthRouter
