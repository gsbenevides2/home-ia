import { pgTable, text } from 'drizzle-orm/pg-core'
import { DatabaseClient } from './client'

const table = pgTable('status_pages', {
  sensor_id: text('sensor_id').notNull(),
  sensor_name: text('sensor_name').notNull(),
  status_platform: text('status_platform').notNull(),
  status_url: text('status_url').notNull()
})

export type StatusPageDatabaseRow = typeof table.$inferSelect

export class StatusPageDatabase {
  private static instance: StatusPageDatabase

  public static getInstance() {
    if (!this.instance) {
      this.instance = new StatusPageDatabase()
    }
    return this.instance
  }

  private constructor() {}

  public async getChecks() {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient.select().from(table)
    await connection.release()
    return result as StatusPageDatabaseRow[]
  }
}
