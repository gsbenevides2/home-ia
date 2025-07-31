import { SpotifyApi } from '@spotify/web-api-ts-sdk'
import { Logger } from '../../logger'

const clientId = Bun.env.SPOTIFY_CLIENT_ID
const clientSecret = Bun.env.SPOTIFY_CLIENT_SECRET

if (!clientId || !clientSecret) {
  throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set')
}

export const SpotifyAPIWrapper = {
  sdk: SpotifyApi.withClientCredentials(clientId, clientSecret),
  async searchTrack(query: string) {
    Logger.info('SpotifyAPIWrapper', 'Searching track', { query })
    const searchResults = await this.sdk.search(query, ['track'])
    Logger.info('SpotifyAPIWrapper', 'Search track results', { searchResults })
    return searchResults.tracks.items
  },
  async searchArtist(query: string) {
    Logger.info('SpotifyAPIWrapper', 'Searching artist', { query })
    const searchResults = await this.sdk.search(query, ['artist'])
    Logger.info('SpotifyAPIWrapper', 'Search artist results', { searchResults })
    return searchResults.artists.items
  },
  async searchAlbum(query: string) {
    Logger.info('SpotifyAPIWrapper', 'Searching album', { query })
    const searchResults = await this.sdk.search(query, ['album'])
    Logger.info('SpotifyAPIWrapper', 'Search album results', { searchResults })
    return searchResults.albums.items
  },
  async getArtistAlbums(artistId: string) {
    Logger.info('SpotifyAPIWrapper', 'Getting artist albums', { artistId })
    const albums = await this.sdk.artists.albums(artistId)
    Logger.info('SpotifyAPIWrapper', 'Artist albums', { albums })
    return albums.items
  },
  async getArtistTopTracks(artistId: string) {
    Logger.info('SpotifyAPIWrapper', 'Getting artist top tracks', { artistId })
    const tracks = await this.sdk.artists.topTracks(artistId, 'BR')
    Logger.info('SpotifyAPIWrapper', 'Artist top tracks', { tracks })
    return tracks.tracks
  },
  async getAlbumTracks(albumId: string) {
    Logger.info('SpotifyAPIWrapper', 'Getting album tracks', { albumId })
    const tracks = await this.sdk.albums.tracks(albumId)
    Logger.info('SpotifyAPIWrapper', 'Album tracks', { tracks })
    return tracks.items
  }
}
