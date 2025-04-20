import { SpotifyApi } from '@spotify/web-api-ts-sdk'

const clientId = Bun.env.SPOTIFY_CLIENT_ID
const clientSecret = Bun.env.SPOTIFY_CLIENT_SECRET

if (!clientId || !clientSecret) {
  throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set')
}

export const SpotifyAPIWrapper = {
  sdk: SpotifyApi.withClientCredentials(clientId, clientSecret),
  async search(query: string) {
    const searchResults = await this.sdk.search(query, ['track'])
    return searchResults.tracks.items
  }
}
