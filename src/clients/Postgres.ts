import { Pool } from "postgres";

export class DatabaseClient {
  private static instance: DatabaseClient;

  private pool: Pool;

  private constructor() {
    this.pool = new Pool(
      {
        user: Deno.env.get("DB_USER"),
        password: Deno.env.get("DB_PASSWORD"),
        database: Deno.env.get("DB_NAME"),
        hostname: Deno.env.get("DB_HOST"),
        port: parseInt(Deno.env.get("DB_PORT") || "5432"),
      },
      5,
      true
    );
  }

  public static async getConnection() {
    if (!this.instance) {
      this.instance = new DatabaseClient();
    }
    const client = await this.instance.pool.connect();
    return client;
  }
}
