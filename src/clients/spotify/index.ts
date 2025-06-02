import { SpotifyApi } from '@spotify/web-api-ts-sdk'

const clientId = Bun.env.SPOTIFY_CLIENT_ID
const clientSecret = Bun.env.SPOTIFY_CLIENT_SECRET

if (!clientId || !clientSecret) {
  throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set')
}

export const SpotifyAPIWrapper = {
  sdk: SpotifyApi.withClientCredentials(clientId, clientSecret),
  async searchTrack(query: string) {
    const searchResults = await this.sdk.search(query, ['track'])
    return searchResults.tracks.items
  },
  async searchArtist(query: string) {
    const searchResults = await this.sdk.search(query, ['artist'])
    return searchResults.artists.items
  },
  async searchAlbum(query: string) {
    const searchResults = await this.sdk.search(query, ['album'])
    return searchResults.albums.items
  },
  async getArtistAlbums(artistId: string) {
    const albums = await this.sdk.artists.albums(artistId)
    return albums.items
  },
  async getArtistTopTracks(artistId: string) {
    const tracks = await this.sdk.artists.topTracks(artistId, 'BR')
    return tracks.tracks
  }
}
