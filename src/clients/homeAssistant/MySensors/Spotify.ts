import { MediaPlayer } from '../AbstractEntities/MediaPlayer'

type SpotifyAccounts = SpotifyType['accounts'][number]
interface SpotifyType {
  accounts: readonly ['Guilherme']
  entities: Record<SpotifyAccounts, string>

  play: (account: SpotifyAccounts) => Promise<void>
  pause: (account: SpotifyAccounts) => Promise<void>
  next: (account: SpotifyAccounts) => Promise<void>
  previous: (account: SpotifyAccounts) => Promise<void>
  setVolume: (account: SpotifyAccounts, volume: number) => Promise<void>
}

export const Spotify = {
  accounts: ['Guilherme'] as const,
  entities: {
    Guilherme: 'media_player.spotify_guilherme_da_silva_benevides'
  },

  getSensor: (account: SpotifyAccounts) => {
    return new MediaPlayer(
      Spotify.entities[account],
      Spotify.entities[account],
      {
        friendly_name: `Spotify ${account}`,
        device_class: 'media_player',
        supported_features: 0,
        volume_level: 0,
        media_content_id: '',
        media_content_type: '',
        media_duration: 0,
        media_position: 0,
        media_position_updated_at: '',
        media_title: '',
        media_artist: '',
        media_album_name: '',
        media_album_artist: '',
        media_track: '',
        source: '',
        shuffle: false,
        repeat: '',
        entity_picture: '',
        token: '',
        source_list: []
      }
    )
  },

  play: async (account: SpotifyAccounts) => {
    const sensor = Spotify.getSensor(account)
    await sensor.play()
  },

  pause: async (account: SpotifyAccounts) => {
    const sensor = Spotify.getSensor(account)
    await sensor.pause()
  },

  next: async (account: SpotifyAccounts) => {
    const sensor = Spotify.getSensor(account)
    await sensor.next()
  },

  previous: async (account: SpotifyAccounts) => {
    const sensor = Spotify.getSensor(account)
    await sensor.previous()
  },

  setVolume: async (account: SpotifyAccounts, volume: number) => {
    const sensor = Spotify.getSensor(account)
    await sensor.setVolume(volume)
  },

  playSong: async (account: SpotifyAccounts, uri: string) => {
    const sensor = Spotify.getSensor(account)
    await sensor.playSong(uri, 'spotify://track')
  }
}
