import { eq, sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { Logger } from '../../logger'
import { DatabaseClient } from './client'

const table = pgTable('saved_prompts', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  prompt: text('prompt').notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
})

export type SavedPromptDatabaseRow = typeof table.$inferSelect

export class SavedPromptDatabase {
  private static instance: SavedPromptDatabase

  private constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SavedPromptDatabase()
    }
    return this.instance
  }

  public async getSavedPrompt(
    id: string
  ): Promise<SavedPromptDatabaseRow | null> {
    Logger.info('SavedPromptDatabase', 'Getting saved prompt', { id })
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient
      .select()
      .from(table)
      .where(eq(table.id, id))
    await connection.release()
    return result[0] as SavedPromptDatabaseRow | null
  }

  public async getSavedPrompts(): Promise<SavedPromptDatabaseRow[]> {
    Logger.info('SavedPromptDatabase', 'Getting saved prompts')
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient.select().from(table)
    await connection.release()
    return result as SavedPromptDatabaseRow[]
  }

  public async createSavedPrompt(
    prompt: Pick<SavedPromptDatabaseRow, 'name' | 'prompt'>
  ): Promise<SavedPromptDatabaseRow> {
    Logger.info('SavedPromptDatabase', 'Creating saved prompt', { prompt })
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient.insert(table).values(prompt).returning()
    await connection.release()
    return result[0] as SavedPromptDatabaseRow
  }

  public async deleteSavedPrompt(id: string): Promise<void> {
    Logger.info('SavedPromptDatabase', 'Deleting saved prompt', { id })
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient.delete(table).where(eq(table.id, id))
    await connection.release()
  }

  public async updateSavedPrompt(
    id: string,
    prompt: Pick<SavedPromptDatabaseRow, 'name' | 'prompt'>
  ): Promise<void> {
    Logger.info('SavedPromptDatabase', 'Updating saved prompt', { id, prompt })
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient.update(table).set(prompt).where(eq(table.id, id))
    await connection.release()
  }
}
