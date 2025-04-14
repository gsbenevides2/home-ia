import { DNSSensor } from "../../clients/homeAssistant/MySensors/DNSSensor.ts";

export async function updateDNSSensors() {
  const dnsSensor = DNSSensor.getInstance();
  await dnsSensor.sendAllSensors();
}
