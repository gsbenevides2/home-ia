import { DatabaseClient } from "./client";

export interface StatusPageDatabaseRow {
  sensor_id: string;
  sensor_name: string;
  status_platform: string;
  status_url: string;
}

export class StatusPageDatabase {
  private static instance: StatusPageDatabase;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new StatusPageDatabase();
    }
    return this.instance;
  }

  private constructor() {}

  public async getChecks() {
    const db = await DatabaseClient.getInstance().getConnection();
    const result = await db`SELECT sensor_id, sensor_name, status_platform, status_url FROM status_pages`.simple();
    await db.release();
    return result as StatusPageDatabaseRow[];
  }
}
