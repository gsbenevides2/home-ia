import { randomUUIDv7 } from 'bun'
import { Logger, type LoggerData } from '.'

export class Tracer {
  protected id: string
  private static globalTracerID: string | undefined
  private program: string | undefined
  constructor() {
    this.id = randomUUIDv7()
  }

  public setProgram(program: string) {
    this.program = program
  }

  public info(message: string, data?: LoggerData) {
    Logger.info(this.program ?? 'unknown', message, data, this.id)
  }

  public error(message: string, data?: LoggerData) {
    Logger.error(this.program ?? 'unknown', message, data, this.id)
  }

  public warn(message: string, data?: LoggerData) {
    Logger.warn(this.program ?? 'unknown', message, data, this.id)
  }

  public setGlobalTracerID() {
    Tracer.globalTracerID = this.id
  }
  public static getGlobalTracer() {
    const tracer = new Tracer()
    tracer.id = Tracer.globalTracerID ?? randomUUIDv7()
    return tracer
  }

  public unsetGlobalTracerID() {
    Tracer.globalTracerID = undefined
  }
}
