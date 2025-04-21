import { DatabaseClient } from './client'

export interface JobDatabaseRow {
  id: string
  type: 'cron' | 'date'
  time: string
  llm: string
  exclude: boolean
}

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
    const db = await DatabaseClient.getInstance().getConnection()
    const result =
      await db`SELECT id, type, time, llm, exclude FROM jobs`.simple()
    await db.release()
    return result as JobDatabaseRow[]
  }

  public async getJob(id: string): Promise<JobDatabaseRow | null> {
    const db = await DatabaseClient.getInstance().getConnection()
    const result =
      await db`SELECT id, type, time, llm, exclude FROM jobs WHERE id = ${id}`
    await db.release()
    return result[0] as JobDatabaseRow | null
  }

  public async createJob(job: Omit<JobDatabaseRow, 'id'>): Promise<string> {
    const db = await DatabaseClient.getInstance().getConnection()
    const result =
      await db`INSERT INTO jobs (type, time, llm, exclude) VALUES (${job.type}, ${job.time}, ${job.llm}, ${job.exclude}) RETURNING id`
    await db.release()
    return result[0].id
  }

  public async deleteJob(id: string): Promise<void> {
    const db = await DatabaseClient.getInstance().getConnection()
    await db`DELETE FROM jobs WHERE id = ${id}`
    await db.release()
  }

  public async updateJob(
    id: string,
    job: Omit<JobDatabaseRow, 'id'>
  ): Promise<void> {
    const db = await DatabaseClient.getInstance().getConnection()
    await db`UPDATE jobs SET type = ${job.type}, time = ${job.time}, llm = ${job.llm}, exclude = ${job.exclude} WHERE id = ${id}`
    await db.release()
  }
}
