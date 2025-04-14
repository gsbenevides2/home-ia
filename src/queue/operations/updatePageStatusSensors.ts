import { StatusSensors } from "../../clients/homeAssistant/MySensors/StatusSensors.ts";

export async function updatePageStatusSensors() {
  const sensors = StatusSensors.getInstance();
  await sensors.sendAllStatus();
}
