import { eq } from 'drizzle-orm'
import { json, pgTable, text } from 'drizzle-orm/pg-core'
import type { Credentials } from 'google-auth-library'
import { DatabaseClient } from './client'

const table = pgTable('google_tokens', {
  email: text('email').primaryKey(),
  tokens: json('tokens').notNull().$type<Credentials>()
})

export type GoogleTokensDatabaseRow = typeof table.$inferSelect

export class GoogleTokensDatabase {
  private static instance: GoogleTokensDatabase

  public static getInstance(): GoogleTokensDatabase {
    if (!GoogleTokensDatabase.instance) {
      GoogleTokensDatabase.instance = new GoogleTokensDatabase()
    }
    return GoogleTokensDatabase.instance
  }

  private constructor() {}

  public async getTokens(email: string): Promise<Credentials | null> {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient
      .select()
      .from(table)
      .where(eq(table.email, email))
    await connection.release()
    return result[0]?.tokens
  }

  public async saveTokens(email: string, tokens: Credentials) {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient
      .insert(table)
      .values({ email, tokens })
      .onConflictDoUpdate({
        target: [table.email],
        set: { tokens }
      })
    await connection.release()
  }

  public async getAllTokens() {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    const result = await drizzleClient.select().from(table)
    await connection.release()
    return result
  }

  public async updateTokens(email: string, tokens: Credentials) {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient
      .update(table)
      .set({ tokens })
      .where(eq(table.email, email))
    await connection.release()
  }
}
