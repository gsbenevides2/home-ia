export abstract class TaskJob {
  abstract name: string
  abstract cron: string
  abstract execute(): Promise<void>
}
