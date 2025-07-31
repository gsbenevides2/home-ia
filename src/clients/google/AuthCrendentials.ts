import { Logger } from '../../logger'

export class AuthCredentials {
  private static instance: AuthCredentials

  public static getInstance(): AuthCredentials {
    return new AuthCredentials()
  }

  public getCredentials() {
    Logger.info('AuthCredentials', 'Getting credentials')
    const projectId = Bun.env.GCP_SERVICE_ACCOUNT_PROJECT_ID
    const clientEmail = Bun.env.GCP_SERVICE_ACCOUNT_CLIENT_EMAIL
    const privateKey = Buffer.from(
      Bun.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY ?? '',
      'base64'
    ).toString('ascii')

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing required GCP credentials in environment variables'
      )
    }
    return {
      credentials: {
        type: 'service_account',
        project_id: projectId,
        private_key_id: Bun.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: clientEmail,
        client_id: Bun.env.GCP_SERVICE_ACCOUNT_CLIENT_ID,
        token_url: Bun.env.GCP_SERVICE_ACCOUNT_TOKEN_URL,
        universe_domain: Bun.env.GCP_SERVICE_ACCOUNT_UNIVERSE_DOMAIN
      },
      projectId
    }
  }
}
