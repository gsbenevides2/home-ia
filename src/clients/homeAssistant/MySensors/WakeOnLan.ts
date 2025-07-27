import { Button } from '../AbstractEntities/Button'

export type WakeOnLanDevice = WakeOnLanType['devices'][number]

export interface WakeOnLanType {
  devices: readonly ['PC_Guilherme']
  entities: Record<WakeOnLanDevice, string>
  wakeUp: (device: WakeOnLanDevice) => Promise<void>
}

export const WakeOnLan: WakeOnLanType = {
  devices: ['PC_Guilherme'],
  entities: {
    PC_Guilherme: '74:56:3c:8a:01:d0'
  },

  async wakeUp(device: WakeOnLanDevice) {
    const macAddress = this.entities[device].replaceAll(':', '_').toLowerCase()
    const sensor = new Button(
      `button.wake_on_lan_${macAddress}`,
      `button.wake_on_lan_${macAddress}`
    )
    await sensor.click()
  }
}
