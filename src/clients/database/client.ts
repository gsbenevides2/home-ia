import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { Logger } from '../../logger'

export class DatabaseClient {
  private static instance: DatabaseClient
  public static getInstance() {
    if (!this.instance) {
      this.instance = new DatabaseClient()
    }
    return this.instance
  }

  private pool: Pool

  private constructor() {
    Logger.info('DatabaseClient', 'Initializing database client')
    this.pool = new Pool({
      database: Bun.env.DB_NAME,
      host: Bun.env.DB_HOST,
      port: parseInt(Bun.env.DB_PORT || '5432'),
      user: Bun.env.DB_USER,
      password: Bun.env.DB_PASSWORD,
      max: 10
    })
    Logger.info('DatabaseClient', 'Database client initialized')
  }

  public async getConnection() {
    const connection = await this.pool.connect()
    const drizzleClient = await drizzle({ client: connection })
    return {
      connection,
      drizzleClient
    }
  }
}
