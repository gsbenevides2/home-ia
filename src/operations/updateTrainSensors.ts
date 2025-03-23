import { DiretoDosTrens } from "../clients/DiretoDosTres.ts";
import { TrainSensors } from "../home-assistant/MySensors/TrainSensors.ts";

export async function updateTrainSensors() {
  const trainSensors = TrainSensors.getInstance();
  const lineStatus = await DiretoDosTrens.getInstance().getLines();
  await trainSensors.updateSensors(lineStatus);
}
