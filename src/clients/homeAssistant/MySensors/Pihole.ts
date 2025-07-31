import { Logger } from '../../../logger'
import { SensorDeviceClass, Switch } from '../AbstractEntities/Switch'

export const Pihole = {
  sensor: new Switch('switch.pi_hole_2', 'switch.pi_hole_2', {
    friendly_name: 'Pihole',
    device_class: SensorDeviceClass.SWITCH
  }),

  async getStatus() {
    Logger.info('Pihole', 'Getting status')
    const { state } = await this.sensor.getData()
    Logger.info('Pihole', 'Status', { state })
    return state === 'on' ? 'on' : 'off'
  },

  async toggleStatus() {
    Logger.info('Pihole', 'Toggling status')
    await this.sensor.updateService('switch', 'toggle')
  },

  async turnOn() {
    Logger.info('Pihole', 'Turning on')
    await this.sensor.updateService('switch', 'turn_on')
  },

  async turnOff() {
    Logger.info('Pihole', 'Turning off')
    await this.sensor.updateService('switch', 'turn_off')
  }
}
