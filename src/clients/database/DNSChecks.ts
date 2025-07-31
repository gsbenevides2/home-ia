import { pgTable, text } from 'drizzle-orm/pg-core'
import { Logger } from '../../logger'
import { DatabaseClient } from './client'

const table = pgTable('dns_checks', {
  sensor_id: text('sensor_id').notNull(),
  sensor_name: text('sensor_name').notNull(),
  expected_cname: text('expected_cname').notNull(),
  domain: text('domain').notNull(),
  nsdomain: text('nsdomain').notNull()
})

export type DNSChecksDatabaseRow = typeof table.$inferSelect

export class DNSChecksDatabase {
  private static instance: DNSChecksDatabase

  public static getInstance() {
    if (!this.instance) {
      this.instance = new DNSChecksDatabase()
    }
    return this.instance
  }

  private constructor() {}

  public async getChecks() {
    Logger.info('DNSChecksDatabase', 'Getting checks')
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient.select().from(table)
    await connection.release()
    return result
  }
}
