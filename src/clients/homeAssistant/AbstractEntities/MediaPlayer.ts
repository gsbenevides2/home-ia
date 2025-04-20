import { Entity, type EntityAttributes, SensorType } from './Entity'

export enum MediaPlayerStates {
  PLAYING = 'playing',
  PAUSED = 'paused',
  OFF = 'off',
  ON = 'on',
  IDLE = 'idle',
  STANDBY = 'standby',
  BUFFERING = 'buffering'
}

export interface MediaPlayerAttributes extends EntityAttributes {
  device_class: 'media_player'
  supported_features: number
  volume_level: number
  media_content_id: string
  media_content_type: string
  media_duration: number
  media_position: number
  media_position_updated_at: string
  media_title: string
  media_artist: string
  media_album_name: string
  media_album_artist: string
  media_track: string
  source: string
  shuffle: boolean
  repeat: string
  entity_picture: string
  token: string
  source_list: string[]
}

export class MediaPlayer extends Entity<
  MediaPlayerStates,
  MediaPlayerAttributes
> {
  constructor(
    entity_id: string,
    unique_id: string,
    attributes: MediaPlayerAttributes
  ) {
    super(SensorType.MEDIA_PLAYER, entity_id, unique_id, attributes)
  }

  async play() {
    await this.updateService('media_player', 'media_play', {})
  }

  async pause() {
    await this.updateService('media_player', 'media_pause', {})
  }

  async stop() {
    await this.updateService('media_player', 'media_stop', {})
  }

  async next() {
    await this.updateService('media_player', 'media_next_track', {})
  }

  async previous() {
    await this.updateService('media_player', 'media_previous_track', {})
  }

  async setVolume(volume: number) {
    await this.updateService('media_player', 'volume_set', {
      volume_level: volume
    })
  }

  async playSong(uri: string, media_content_type: string) {
    await this.updateService('media_player', 'play_media', {
      media_content_id: uri,
      media_content_type: media_content_type
    })
  }
}
