import { Logger } from '../../../logger/index.ts'
import { asyncFind } from '../../../utils/arrays.ts'
import {
  SensorDeviceClass,
  Switch,
  type SensorAttributes
} from '../AbstractEntities/Switch.ts'

export type Sensor = Switch<SensorAttributes>
export type FanSensorsRooms = FanSensorsType['rooms'][number]
export type Velocities = FanSensorsType['velocities'][number]
export type VelocitiesSwitches = Record<
  Exclude<Velocities, 'desligado'>,
  Sensor
>

export interface FanSensorsType {
  rooms: readonly ['Quarto Gui']
  velocities: readonly ['alta', 'media', 'baixa', 'desligado']
  switches: Record<FanSensorsRooms, VelocitiesSwitches>
  getFanRoom: (room: FanSensorsRooms) => Promise<boolean>
  setFanRoom: (room: FanSensorsRooms, velocity: Velocities) => Promise<void>
}

export const FanSensors = {
  rooms: ['Quarto Gui'] as const,
  velocities: ['alta', 'media', 'baixa', 'desligado'] as const,
  switches: {
    'Quarto Gui': {
      alta: new Switch('switch.ventilador_alta', 'switch.ventilador_alta', {
        friendly_name: 'Alta',
        device_class: SensorDeviceClass.SWITCH
      }),
      baixa: new Switch('switch.ventilador_baixa', 'switch.ventilador_baixa', {
        friendly_name: 'Baixa',
        device_class: SensorDeviceClass.SWITCH
      }),
      media: new Switch('switch.ventilador_media', 'switch.ventilador_media', {
        friendly_name: 'Média',
        device_class: SensorDeviceClass.SWITCH
      })
    }
  },

  async getFanRoom(room: (typeof this.rooms)[number]) {
    Logger.info('FanSensors', 'Getting fan room', { room })
    const roomData = this.switches[room]
    const velocities = Object.keys(roomData) as (keyof typeof roomData)[]
    const states = await asyncFind(velocities, async velocity => {
      const state = await roomData[velocity].getData()
      return state.state === 'on'
    })
    Logger.info('FanSensors', 'Fan room state', { room, states })
    return states ?? 'off'
  },

  async setFanRoom(room: FanSensorsRooms, velocity: Velocities) {
    Logger.info('FanSensors', 'Setting fan room', { room, velocity })
    const roomData = this.switches[room]
    if (velocity === 'desligado') {
      const switches = Object.values(roomData)
      await Promise.all(
        switches.map(swt => swt.updateService('switch', 'turn_off'))
      )
      return
    }
    const velocityData = roomData[velocity]
    await velocityData.updateService('switch', 'turn_on')
  }
}
