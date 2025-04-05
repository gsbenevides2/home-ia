import { DNSSensor } from "../home-assistant/MySensors/DNSSensor.ts";

export async function updateDNSSensors(){
    const dnsSensor = DNSSensor.getInstance();
    await dnsSensor.sendAllSensors();
}