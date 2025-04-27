import type {
  ContentBlockParam,
  MessageParam
} from '@anthropic-ai/sdk/resources/index.mjs'
import { desc, inArray, sql } from 'drizzle-orm'
import { json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { DatabaseClient } from './client'

const table = pgTable('chatbot', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  role: text('role').notNull().$type<MessageParam['role']>(),
  content: json('content').notNull().$type<ContentBlockParam[]>(),
  date: timestamp('date', {
    withTimezone: true
  })
    .notNull()
    .default(sql`now()`),
  interactionId: uuid('interactionId').notNull()
})

type ChatbotDatabaseRow = typeof table.$inferSelect

const MAX_INTERACTIONS = 3

export class ChatbotDatabase {
  private static instance: ChatbotDatabase

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ChatbotDatabase()
    }
    return this.instance
  }

  private constructor() {}

  public async getMessagesOldMessages() {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()

    const lastInteractionResult = await drizzleClient
      .select({
        interactionId: table.interactionId
      })
      .from(table)
      .orderBy(desc(table.date))
      .limit(MAX_INTERACTIONS)

    if (!lastInteractionResult.length) return []

    const result = await drizzleClient
      .select({
        content: table.content,
        role: table.role,
        interactionId: table.interactionId,
        date: table.date
      })
      .from(table)
      .where(
        inArray(
          table.interactionId,
          lastInteractionResult.map(i => i.interactionId)
        )
      )
      .orderBy(desc(table.date))

    await connection.release()
    return result
  }

  public async saveMessage(
    message: Pick<ChatbotDatabaseRow, 'content' | 'role' | 'interactionId'>
  ) {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient.insert(table).values({
      role: message.role,
      content: message.content,
      interactionId: message.interactionId
    })
    await connection.release()
  }

  public async clearMessages() {
    const { connection, drizzleClient } =
      await DatabaseClient.getInstance().getConnection()
    await drizzleClient.delete(table)
    await connection.release()
  }
}
