import { SQL } from "bun";

export class DatabaseClient {
  private static instance: DatabaseClient;
  public static getInstance() {
    if (!this.instance) {
      this.instance = new DatabaseClient();
    }
    return this.instance;
  }

  private pool: SQL;

  private constructor() {
    this.pool = new SQL({
      database: Bun.env.DB_NAME,
      hostname: Bun.env.DB_HOST,
      port: parseInt(Bun.env.DB_PORT || "5432"),
      user: Bun.env.DB_USER,
      password: Bun.env.DB_PASSWORD,
      max: 10,
    });
  }

  public async getConnection() {
    const client = await this.pool.connect();
    const reserved = await client.reserve();
    return reserved;
  }
}
