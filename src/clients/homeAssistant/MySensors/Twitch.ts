import { Logger } from '../../../logger'
import { Entity } from '../AbstractEntities/Entity'
import { Sensor, type SensorAttributes } from '../AbstractEntities/Sensor'

interface TwitchSensorAttributes extends SensorAttributes {
  options: Array<string>
  game: string | null
  title: string | null
  started_at: string | null
  viewers: number | null
  followers: number | null
  subscribed: boolean | null
  subscription_is_gifted: boolean | null
  subscription_tier: string | null
  following: boolean | null
  following_since: string | null
  entity_picture: string | null
}

type TwitchSensorState = 'streaming' | 'offline'

interface TwitchStreamer {
  friendly_name: string
  id: string
}

export type TwitchType = {
  getStreamers: () => Promise<Array<TwitchStreamer>>
  getStreamerStatus: (streamer: string) => Promise<{
    status: TwitchSensorState
    attributes: TwitchSensorAttributes
  }>
}

export const Twitch: TwitchType = {
  getStreamers: async () => {
    Logger.info('Twitch', 'Getting streamers')
    const entities = await Entity.getAllEntities()
    const twitchEntities = entities.filter(entity => {
      const icon = entity.attributes.entity_picture
      if (typeof icon === 'string') {
        return icon.includes('https://static-cdn.jtvnw.net/jtv_user_pictures')
      }
      return false
    })
    return twitchEntities.map<TwitchStreamer>(entity => ({
      friendly_name: entity.attributes.friendly_name as string,
      id: entity.entity_id.replace('sensor.', '')
    }))
  },
  getStreamerStatus: async (streamerId: string) => {
    Logger.info('Twitch', 'Getting streamer status', { streamerId })
    const sensor = new Sensor<TwitchSensorState, TwitchSensorAttributes>(
      `sensor.${streamerId}`,
      `sensor.${streamerId}`,
      {
        friendly_name: '',
        options: [],
        subscribed: false,
        following: false,
        game: null,
        title: null,
        started_at: null,
        viewers: null,
        followers: null,
        subscription_is_gifted: null,
        subscription_tier: null,
        following_since: null,
        entity_picture: null
      }
    )
    const data = await sensor.getData()
    Logger.info('Twitch', 'Streamer status', { data })
    return {
      status: data.state,
      attributes: {
        game: data.attributes.game,
        title: data.attributes.title,
        started_at: data.attributes.started_at,
        viewers: data.attributes.viewers,
        subscribed: data.attributes.subscribed,
        subscription_is_gifted: data.attributes.subscription_is_gifted,
        subscription_tier: data.attributes.subscription_tier,
        following: data.attributes.following,
        following_since: data.attributes.following_since,
        entity_picture: data.attributes.entity_picture,
        options: data.attributes.options,
        friendly_name: data.attributes.friendly_name,
        followers: data.attributes.followers
      }
    }
  }
}
