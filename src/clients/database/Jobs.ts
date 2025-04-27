import { eq, sql } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { DatabaseClient } from './client'

const table = pgTable('jobs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  type: text('type').notNull(),
  time: text('time').notNull(),
  llm: text('llm').notNull(),
  exclude: boolean('exclude').notNull().default(true),
  created_at: timestamp('created_at', {
    withTimezone: true
  })
    .notNull()
    .default(sql`now()`)
})

type JobDatabaseRow = typeof table.$inferSelect

export class JobDatabase {
  private static instance: JobDatabase

  private constructor() {}

  public static getInstance(): JobDatabase {
    if (!JobDatabase.instance) {
      JobDatabase.instance = new JobDatabase()
    }
    return JobDatabase.instance
  }

  public async getJobs(): Promise<JobDatabaseRow[]> {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient.select().from(table)
    await connection.release()
    return result
  }

  public async getJob(id: string): Promise<JobDatabaseRow | null> {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient
      .select()
      .from(table)
      .where(eq(table.id, id))
    await connection.release()
    return result[0] as JobDatabaseRow | null
  }

  public async createJob(
    job: Omit<JobDatabaseRow, 'id' | 'created_at'>
  ): Promise<string> {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient.insert(table).values(job).returning()
    await connection.release()
    return result[0].id
  }

  public async deleteJob(id: string): Promise<void> {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient.delete(table).where(eq(table.id, id))
    await connection.release()
  }

  public async updateJob(
    id: string,
    job: Omit<JobDatabaseRow, 'id' | 'created_at'>
  ): Promise<void> {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient.update(table).set(job).where(eq(table.id, id))
    await connection.release()
  }
}
