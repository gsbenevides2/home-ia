import { CodespacesSensor } from './MySensors/CodespacesSensor'
import { TurnOffPc } from './MySensors/TurnOffPc'

export async function setupAllButtons() {
  await TurnOffPc.getInstance().setupButton()
  await CodespacesSensor.getInstance().setupButton()
}
