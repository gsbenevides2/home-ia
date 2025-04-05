import { StatusSensors } from "../home-assistant/MySensors/StatusSensors.ts";

export async function updatePageStatusSensors() {
  const sensors = StatusSensors.getInstance();
  await sensors.sendAllStatus();
}
