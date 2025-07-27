import { CloudMachineEndWorkDay } from './CloudMachineEndWorkDay'
import { CloudMachineStartWorkDay } from './CloudMachineStartWorkDay'
import { PlatformStatusMonitor } from './PlatformStatusMonitor'
import type { TaskJob } from './TaskJob'
import { TurnOnPcWorkDay } from './TurnOnPC'
import { UpdateSensors } from './UpdateSensors'
import { WorkDayTrainCheck } from './WorkDayTrainCheck'

export const tasks: TaskJob[] = [
  new UpdateSensors(),
  new CloudMachineStartWorkDay(),
  new CloudMachineEndWorkDay(),
  new WorkDayTrainCheck(),
  new PlatformStatusMonitor(),
  new TurnOnPcWorkDay()
]
