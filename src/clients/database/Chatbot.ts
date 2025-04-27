import { sql } from 'bun'
import { DatabaseClient } from './client'

export interface CahtbotDatabaseRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  date: string
  interactionId: string
}

const MAX_INTERACTIONS = 1

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
    const db = await DatabaseClient.getInstance().getConnection()
    const lastInteractionResult =
      await db`SELECT c."interactionId" FROM chatbot c ORDER BY c."date" DESC LIMIT ${MAX_INTERACTIONS}`
    if (!lastInteractionResult.length) return []

    const result =
      await db`SELECT c.content, c.role, c."interactionId", c."date" FROM chatbot c WHERE c."interactionId" IN ${sql(lastInteractionResult, 'interactionId')} ORDER BY c."date" DESC`

    await db.release()
    return result as Pick<
      CahtbotDatabaseRow,
      'content' | 'role' | 'interactionId'
    >[]
  }

  public async saveMessage(
    message: Pick<CahtbotDatabaseRow, 'content' | 'role' | 'interactionId'>
  ) {
    const db = await DatabaseClient.getInstance().getConnection()
    await db`INSERT INTO chatbot ${sql(message)}`
    await db.release()
  }

  public async clearMessages() {
    const db = await DatabaseClient.getInstance().getConnection()
    await db`DELETE FROM chatbot`
    await db.release()
  }
}
