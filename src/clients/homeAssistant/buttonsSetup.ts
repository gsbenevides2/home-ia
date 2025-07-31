import { Logger } from '../../logger'
import { CodespacesSensor } from './MySensors/CodespacesSensor'
import { TurnOffPc } from './MySensors/TurnOffPc'

export async function setupAllButtons() {
  Logger.info('setupAllButtons', 'Setting up buttons')
  await TurnOffPc.getInstance().setupButton()
  await CodespacesSensor.getInstance().setupButton()
  Logger.info('setupAllButtons', 'Buttons set up')
}
