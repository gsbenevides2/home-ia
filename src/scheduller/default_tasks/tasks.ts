import { CloudMachineEndWorkDay } from './CloudMachineEndWorkDay'
import { CloudMachineStartWorkDay } from './CloudMachineStartWorkDay'
import type { TaskJob } from './TaskJob'
import { UpdateSensors } from './UpdateSensors'
import { WorkDayTrainCheck } from './WorkDayTrainCheck'

export const tasks: TaskJob[] = [
  new UpdateSensors(),
  new CloudMachineStartWorkDay(),
  new CloudMachineEndWorkDay(),
  new WorkDayTrainCheck()
]
