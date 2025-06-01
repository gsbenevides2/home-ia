import { Entity, SensorType } from './Entity'

export class Button extends Entity<never, never> {
  constructor(entity_id: string, unique_id: string) {
    super(SensorType.BUTTON, entity_id, unique_id, {} as never)
  }

  async click() {
    await this.updateService('button', 'press')
  }
}
