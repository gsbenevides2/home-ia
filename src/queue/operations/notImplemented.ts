import { Logger } from "../../logger/index.ts";

export const nonImplemented = () => {
  return new Promise<void>((resolve) => {
    Logger.error("Queue", "Not implemented");
    resolve();
  });
};
