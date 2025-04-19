import { DatabaseClient } from "./src/clients/database/client";

const db = await DatabaseClient.getInstance().getConnection();
const result = (await db`SELECT sensor_id, sensor_name, expected_cname, domain, nsdomain FROM dns_checks`.simple()) as {
  sensor_id: string;
  sensor_name: string;
  expected_cname: string;
  domain: string;
  nsdomain: string;
}[];
console.log(result.map((r) => r.sensor_name));
await db.release();
await db.end();
