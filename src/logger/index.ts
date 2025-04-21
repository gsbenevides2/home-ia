import winston from 'winston'
import { OpenObserveTransport } from './openObserve.ts'

const OPEN_OBSERVE_ENDPOINT = Bun.env.OPEN_OBSERVE_ENDPOINT
const OPEN_OBSERVE_ORGANIZATION = Bun.env.OPEN_OBSERVE_ORGANIZATION
const OPEN_OBSERVE_STREAM = Bun.env.OPEN_OBSERVE_STREAM
const OPEN_OBSERVE_USERNAME = Bun.env.OPEN_OBSERVE_USERNAME
const OPEN_OBSERVE_PASSWORD = Bun.env.OPEN_OBSERVE_PASSWORD

if (
  !OPEN_OBSERVE_ENDPOINT ||
  !OPEN_OBSERVE_ORGANIZATION ||
  !OPEN_OBSERVE_STREAM ||
  !OPEN_OBSERVE_USERNAME ||
  !OPEN_OBSERVE_PASSWORD
) {
  throw new Error(
    'OPEN_OBSERVE_ENDPOINT, OPEN_OBSERVE_ORGANIZATION, OPEN_OBSERVE_STREAM, OPEN_OBSERVE_USERNAME, OPEN_OBSERVE_PASSWORD is not set'
  )
}

const openObserveTransport = new OpenObserveTransport({
  endpoint: OPEN_OBSERVE_ENDPOINT,
  organization: OPEN_OBSERVE_ORGANIZATION,
  stream: OPEN_OBSERVE_STREAM,
  auth: {
    username: OPEN_OBSERVE_USERNAME,
    password: OPEN_OBSERVE_PASSWORD
  }
})

export type LoggerData = object | Array<unknown> | string | unknown | undefined

const disableOpenObserve = Bun.env.DISABLE_OPEN_OBSERVE === 'true'

export class Logger {
  private static logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: disableOpenObserve
      ? [
          new winston.transports.Console({
            log(info, next) {
              next()
            }
          })
        ]
      : [openObserveTransport, new winston.transports.Console()]
  })

  public static info(
    program: string,
    message: string,
    data?: LoggerData,
    tracerId?: string
  ) {
    this.logger.info(message, {
      program,
      data,
      tracerId
    })
  }

  public static error(
    program: string,
    message: string,
    data?: LoggerData,
    tracerId?: string
  ) {
    this.logger.info(message, {
      program,
      data,
      tracerId
    })
  }

  public static warn(
    program: string,
    message: string,
    data?: LoggerData,
    tracerId?: string
  ) {
    this.logger.info(message, {
      program,
      data,
      tracerId
    })
  }
}
