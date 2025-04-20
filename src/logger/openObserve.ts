import axios from "axios";
import { getTime } from "date-fns";
import Transport, { type TransportStreamOptions } from "winston-transport";

interface OpenObserveTransportOptions extends TransportStreamOptions {
  endpoint: string;
  organization: string;
  stream: string;
  auth: {
    username: string;
    password: string;
  };
}

interface WinstonLog {
  timestamp: Date;
  level: string;
  message: string;
  program: string;
  data: unknown;
  tracerId?: string;
}

export class OpenObserveTransport extends Transport {
  private readonly endpoint: string;
  private readonly organization: string;
  private readonly stream: string;
  private readonly auth: {
    username: string;
    password: string;
  };
  constructor(options: OpenObserveTransportOptions) {
    super(options);
    this.endpoint = options.endpoint;
    this.organization = options.organization;
    this.stream = options.stream;
    this.auth = options.auth;
  }

  public override log(info: WinstonLog, next: () => void) {
    axios.post(
      `${this.endpoint}/api/${this.organization}/${this.stream}/_json`,
      {
        _timestamp: getTime(info.timestamp),
        level: info.level,
        message: info.message,
        data: info.data,
        tracerId: info.tracerId,
        program: info.program,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${this.auth.username}:${this.auth.password}`)}`,
        },
      },
    );
    next();
  }
}
