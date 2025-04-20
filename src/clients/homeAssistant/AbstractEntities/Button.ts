import { Entity, SensorType } from './Entity'

export class Button extends Entity<never, never> {
  constructor(entity_id: string, unique_id: string, attributes: never) {
    super(SensorType.BUTTON, entity_id, unique_id, attributes)
  }

  async click() {
    await this.updateService('button', 'press')
  }
}
