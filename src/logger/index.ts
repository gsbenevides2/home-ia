import winston from "winston";
import { OpenObserveTransport } from "./openObserve.ts";

const OPEN_OBSERVE_ENDPOINT = Deno.env.get("OPEN_OBSERVE_ENDPOINT");
const OPEN_OBSERVE_ORGANIZATION = Deno.env.get("OPEN_OBSERVE_ORGANIZATION");
const OPEN_OBSERVE_STREAM = Deno.env.get("OPEN_OBSERVE_STREAM");
const OPEN_OBSERVE_USERNAME = Deno.env.get("OPEN_OBSERVE_USERNAME");
const OPEN_OBSERVE_PASSWORD = Deno.env.get("OPEN_OBSERVE_PASSWORD");

if (!OPEN_OBSERVE_ENDPOINT || !OPEN_OBSERVE_ORGANIZATION || !OPEN_OBSERVE_STREAM || !OPEN_OBSERVE_USERNAME || !OPEN_OBSERVE_PASSWORD) {
  throw new Error("OPEN_OBSERVE_ENDPOINT, OPEN_OBSERVE_ORGANIZATION, OPEN_OBSERVE_STREAM, OPEN_OBSERVE_USERNAME, OPEN_OBSERVE_PASSWORD is not set");
}

const openObserveTransport = new OpenObserveTransport({
  endpoint: OPEN_OBSERVE_ENDPOINT,
  organization: OPEN_OBSERVE_ORGANIZATION,
  stream: OPEN_OBSERVE_STREAM,
  auth: {
    username: OPEN_OBSERVE_USERNAME,
    password: OPEN_OBSERVE_PASSWORD,
  },
});

export class Logger {
  private static logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [openObserveTransport, new winston.transports.Console()],
  });

  public static info(program: string, message: string, ...data: unknown[]) {
    const initialMessage = `[${program}] ${message}`;
    this.logger.info(initialMessage, {
      data,
    });
  }

  public static error(program: string, message: string, ...data: unknown[]) {
    const initialMessage = `[${program}] ${message}`;
    this.logger.error(initialMessage, {
      data,
    });
  }

  public static warn(program: string, message: string, ...data: unknown[]) {
    const initialMessage = `[${program}] ${message}`;
    this.logger.warn(initialMessage, {
      data,
    });
  }
}
