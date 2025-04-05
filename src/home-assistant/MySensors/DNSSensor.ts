import { makeDNSTest } from "../../clients/MakeDNSTest.ts";
import { DatabaseClient } from "../../clients/Postgres.ts";
import { BinarySensor, BinarySensorDeviceClass } from "../AbstractEntities/BinarySensor.ts";

interface DbRow {
    sensor_id: string;
    sensor_name: string;
    expected_cname: string;
    domain: string;
    nsdomain: string;
}

export class DNSSensor {
    private static instance: DNSSensor = new DNSSensor();
    private constructor() {}
    static getInstance() {
        return this.instance;
    }
    
    private async getDbDNSServers(){
        const db = DatabaseClient.getInstance();
        const result = await db.queryObject<DbRow>({
            text: "SELECT sensor_id, sensor_name, expected_cname, domain, nsdomain FROM dns_checks",
            fields: ["sensor_id", "sensor_name", "expected_cname", "domain", "nsdomain"],
        });
        return result.rows;
    }

    private async sendSensor(sensorData: DbRow){
        const testResult = await makeDNSTest(sensorData.domain, sensorData.expected_cname, sensorData.nsdomain);
        const sensor = new BinarySensor(sensorData.sensor_id, sensorData.sensor_id, {
            friendly_name: sensorData.sensor_name,
            device_class: BinarySensorDeviceClass.PROBLEM,
        });
        await sensor.sendState(testResult === false);
    }

    public async sendAllSensors(){
        const dnsServers = await this.getDbDNSServers();
        await Promise.all(dnsServers.map(this.sendSensor));
    }

}