import { spawn } from "node:child_process";
import { Logger } from "../logger/index.ts";

function nodeSpawn(command: string) {
  const child = spawn(command, { shell: true });
  let result = "";
  return new Promise<string>((resolve, reject) => {
    child.stdout.on("data", (data) => {
      result += data.toString();
    });
    child.stderr.on("data", (data) => {
      reject(data.toString());
    });
    child.on("close", () => resolve(result));
  });
}
async function runDigCommand(domain: string, ns: string) {
  try {
    const result = await nodeSpawn(`/usr/bin/dig ${domain} @${ns} +short CNAME`);

    return result.split("\n")[0];
  } catch (error) {
    Logger.error("MakeDNSTest", "Error running dig command: ${error}");
    return null;
  }
}

async function getNSRecords(domain: string) {
  const result = await nodeSpawn(`/usr/bin/dig ${domain} +short NS`);
  return result.split("\n").filter((line) => line.trim() !== "");
}

export async function makeDNSTest(domain: string, expectedCname: string, nsDomain: string): Promise<boolean> {
  let testResult = false;

  const nsRecords = await getNSRecords(nsDomain);
  for (const ns of nsRecords) {
    Logger.info("MakeDNSTest", `Testing ${domain} with NS ${ns}`);
    const cname = await runDigCommand(domain, ns);
    if (cname === expectedCname) {
      Logger.info("MakeDNSTest", `Test passed for ${domain} with NS ${ns}`);
      testResult = true;
      break;
    }
  }
  if (!testResult) {
    Logger.error("MakeDNSTest", `Test failed for ${domain}`);
  }
  return testResult;
}
