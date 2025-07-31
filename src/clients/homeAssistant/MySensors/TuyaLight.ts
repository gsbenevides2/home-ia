import { Logger } from '../../../logger/index.ts'
import {
  BinarySensor,
  type BinarySensorAttributes,
  BinarySensorDeviceClass
} from '../AbstractEntities/BinarySensor.ts'

export const availableLightsNames = ['Quarto Gui', 'Quarto Ana'] as const
export type AvailableLightsNames = (typeof availableLightsNames)[number]

export type AvailableLightsId = {
  [key in AvailableLightsNames]: string
}

export const lightsId: AvailableLightsId = {
  'Quarto Gui': 'quarto_gui',
  'Quarto Ana': 'quarto_ana'
}

export interface LightAttributes extends BinarySensorAttributes {
  brightness: number
}

export class TuyaLight {
  public static async getLightState(light: AvailableLightsNames) {
    Logger.info('TuyaLight', 'Getting light state', { light })
    const sensorId = `light.${lightsId[light]}`
    const sensor = new BinarySensor(sensorId, sensorId, {
      friendly_name: light,
      device_class: BinarySensorDeviceClass.LIGHT
    })
    const { state } = await sensor.getData()
    Logger.info('TuyaLight', 'Light state', { state })
    return state
  }

  public static async getLightBrightness(light: AvailableLightsNames) {
    Logger.info('TuyaLight', 'Getting light brightness', { light })
    const sensorId = `light.${lightsId[light]}`
    const sensor = new BinarySensor<LightAttributes>(sensorId, sensorId, {
      friendly_name: light,
      device_class: BinarySensorDeviceClass.LIGHT,
      brightness: 0
    })
    const { attributes } = await sensor.getData()
    Logger.info('TuyaLight', 'Light brightness', { attributes })
    const maxLightBrightness = 255
    return Math.round((attributes.brightness / maxLightBrightness) * 100)
  }

  public static async setLightState(
    light: AvailableLightsNames,
    state: 'on' | 'off'
  ) {
    Logger.info('TuyaLight', 'Setting light state', { light, state })
    const sensorId = `light.${lightsId[light]}`
    const sensor = new BinarySensor(sensorId, sensorId, {
      friendly_name: light,
      device_class: BinarySensorDeviceClass.LIGHT
    })
    await sensor.updateService('light', state === 'on' ? 'turn_on' : 'turn_off')
  }

  public static async setLightBrightness(
    light: AvailableLightsNames,
    brightness: number
  ) {
    Logger.info('TuyaLight', 'Setting light brightness', { light, brightness })
    const sensorId = `light.${lightsId[light]}`
    const sensor = new BinarySensor(sensorId, sensorId, {
      friendly_name: light,
      device_class: BinarySensorDeviceClass.LIGHT
    })

    await sensor.updateService('light', 'turn_on', {
      brightness_pct: brightness
    })
  }
}
