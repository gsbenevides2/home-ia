import { DatabaseClient } from "./client";

export interface DNSChecksDatabaseRow {
  sensor_id: string;
  sensor_name: string;
  expected_cname: string;
  domain: string;
  nsdomain: string;
}

export class DNSChecksDatabase {
  private static instance: DNSChecksDatabase;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new DNSChecksDatabase();
    }
    return this.instance;
  }

  private constructor() {}

  public async getChecks() {
    const db = await DatabaseClient.getInstance().getConnection();
    const result = await db`SELECT sensor_id, sensor_name, expected_cname, domain, nsdomain FROM dns_checks`.simple();
    await db.release();
    return result as DNSChecksDatabaseRow[];
  }
}
