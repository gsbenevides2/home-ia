import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import type { OAuthClientMetadata } from '@modelcontextprotocol/sdk/shared/auth.js'
import * as Bun from 'bun'

export class EnvironmentOAuthProvider implements OAuthClientProvider {
  redirectUrl = new URL('http://localhost:3000/sse')
  clientMetadata: OAuthClientMetadata = {
    redirect_uris: [this.redirectUrl.toString()]
  }
  clientInformation = () => {
    return {
      client_id: 'mcp-client-cli',
      client_secret: 'mcp-client-cli-secret',
      client_id_issued_at: Date.now(),
      client_secret_expires_at: Date.now() + 1000 * 60 * 60 * 24 * 30
    }
  }
  tokens = () => {
    return {
      access_token: Bun.env.AUTH_TOKEN!,
      token_type: 'Bearer'
    }
  }
  saveTokens = () => {}
  redirectToAuthorization = () => {}
  saveCodeVerifier = () => {}
  codeVerifier = () => {
    return '1234567890'
  }
}
