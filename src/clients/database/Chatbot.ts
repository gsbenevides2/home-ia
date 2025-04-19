import { sql } from "bun";
import { DatabaseClient } from "./client";

export interface CahtbotDatabaseRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  date: string;
}

export class ChatbotDatabase {
  private static instance: ChatbotDatabase;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ChatbotDatabase();
    }
    return this.instance;
  }

  private constructor() {}

  public async getMessagesOldMessages() {
    const db = await DatabaseClient.getInstance().getConnection();
    const result = await db`SELECT c.content, c.role FROM chatbot c ORDER BY c."date" DESC LIMIT 10`.simple();
    await db.release();
    return result as Pick<CahtbotDatabaseRow, "content" | "role">[];
  }

  public async saveMessage(message: Pick<CahtbotDatabaseRow, "content" | "role">) {
    const db = await DatabaseClient.getInstance().getConnection();
    await db`INSERT INTO chatbot ${sql(message)}`;
    await db.release();
  }

  public async clearMessages() {
    const db = await DatabaseClient.getInstance().getConnection();
    await db`DELETE FROM chatbot`;
    await db.release();
  }
}
