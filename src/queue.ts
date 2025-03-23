import { codespacesStart } from "./operations/codespacesStart.ts";
import { codespacesStop } from "./operations/codespacesStop.ts";
import { codespacesToggle } from "./operations/codespacesToggle.ts";
import { updateCodespacesSensor } from "./operations/updateCodespacesSensor.ts";
import { updateTrainSensors } from "./operations/updateTrainSensors.ts";

export const db = await Deno.openKv();

export enum Operations {
  codespacesStart = "codespaces-start",
  codespacesStop = "codespaces-stop",
  codespacesToggle = "codespaces-toggle",
  updateTrainSensors = "update-train-sensors",
  updateCodespacesSensor = "update-codespaces-sensor",
}

const nonImplemented = () => {
  return new Promise<void>((resolve) => {
    console.log("Not implemented");
    resolve();
  });
};

const opFuncs: Record<Operations, () => Promise<void>> = {
  "codespaces-start": codespacesStart,
  "codespaces-stop": codespacesStop,
  "codespaces-toggle": codespacesToggle,
  "update-train-sensors": updateTrainSensors,
  "update-codespaces-sensor": updateCodespacesSensor,
};

db.listenQueue(async (operation: Operations) => {
  console.log("Operation received", operation);
  try {
    await opFuncs[operation]();
    console.log("Operation completed", operation);
  } catch (e) {
    console.error("Operation failed", operation, e);
  }
});

export const addToQueue = async (operation: Operations) => {
  await db.enqueue(operation);
};
