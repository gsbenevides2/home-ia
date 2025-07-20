import type { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { GoogleTokensDatabase } from '../../database/GoogleTokens'
import {
  OAUTH_REDIRECT_URI_PATHNAME,
  OAUTH_STATER_URI_PATHNAME
} from './constants'

export class OauthClient {
  private static instance: OauthClient

  public static getInstance(): OauthClient {
    if (!OauthClient.instance) {
      OauthClient.instance = new OauthClient()
    }
    return OauthClient.instance
  }

  private constructor() {}

  public readonly redirectUri = new URL(
    OAUTH_REDIRECT_URI_PATHNAME,
    process.env.GCP_OAUTH_REDIRECT_URI_HOST
  )
  public readonly staterUrl = new URL(
    OAUTH_STATER_URI_PATHNAME,
    process.env.GCP_OAUTH_REDIRECT_URI_HOST
  )

  private scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
  ]

  public async handleOauthUrl() {
    const redirectUri = this.redirectUri.toString()
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_OAUTH_CLIENT_ID,
      process.env.GCP_OAUTH_CLIENT_SECRET,
      redirectUri
    )
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent'
    })

    const response = new Response(null, {
      headers: {
        Location: authUrl
      },
      status: 302
    })

    return response
  }

  public async handleOauthRedirect(req: Request) {
    const code = new URL(req.url).searchParams.get('code')
    if (code) {
      throw new Error('Code not found')
    }
    const redirectUri = this.redirectUri.toString()
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_OAUTH_CLIENT_ID,
      process.env.GCP_OAUTH_CLIENT_SECRET,
      redirectUri
    )
    const { tokens } = await oauth2Client.getToken(code as string)
    await oauth2Client.setCredentials(tokens)
    const userData = await google.oauth2('v2').userinfo.get({
      auth: oauth2Client
    })
    const email = userData.data.email
    if (!email) {
      throw new Error('Email not found')
    }
    await GoogleTokensDatabase.getInstance().saveTokens(email, tokens)
  }

  public async getOauthClient(email: string) {
    const tokens = await GoogleTokensDatabase.getInstance().getTokens(email)
    if (!tokens) {
      throw new Error('Tokens not found')
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.GCP_OAUTH_CLIENT_ID,
      process.env.GCP_OAUTH_CLIENT_SECRET,
      this.redirectUri.toString()
    )
    oauth2Client.on('tokens', newTokens => {
      GoogleTokensDatabase.getInstance().updateTokens(email, {
        ...tokens,
        ...newTokens
      })
    })
    oauth2Client.setCredentials(tokens)
    return oauth2Client
  }

  public async prepareOauthClientsForAllEmails() {
    const tokens = await GoogleTokensDatabase.getInstance().getAllTokens()
    const oauth2Clients: {
      email: string
      oauth2Client: OAuth2Client
    }[] = []
    for (const token of tokens) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GCP_OAUTH_CLIENT_ID,
        process.env.GCP_OAUTH_CLIENT_SECRET,
        this.redirectUri.toString()
      )
      oauth2Client.on('tokens', newTokens => {
        GoogleTokensDatabase.getInstance().updateTokens(token.email, {
          ...token.tokens,
          ...newTokens,
          refresh_token: token.tokens.refresh_token
        })
      })

      oauth2Client.setCredentials(token.tokens)
      oauth2Clients.push({
        email: token.email,
        oauth2Client
      })
    }
    return oauth2Clients
  }
}
