import { Hono } from "hono";
import { CodespacesComputeEngineMachine } from "./clients/CodespacesComputeEngineMachine.ts";
import { CodespacesSensor } from "./home-assistant/MySensors/CodespacesSensor.ts";

const port = Deno.env.get("PORT");
const IS_GOOGLE_CLOUD_RUN = Deno.env.get("K_SERVICE") !== undefined;
if (!port) {
  throw new Error("PORT not set");
}

const app = new Hono();

app.use(async (ctx, next) => {
  // CORS
  ctx.res.headers.set("Access-Control-Allow-Origin", "*");
  ctx.res.headers.set("Access-Control-Allow-Headers", "*");
  ctx.res.headers.set("Access-Control-Allow-Methods", "*");
  ctx.res.headers.set("Access-Control-Allow-Credentials", "true");
  // Preflight
  ctx.res.headers.set("Access-Control-Max-Age", "86400");
  // Expose headers
  ctx.res.headers.set("Access-Control-Expose-Headers", "*");

  await next();
});

app.post("/codespaces", async (c) => {
  const codespacesCompute = await CodespacesComputeEngineMachine.getInstance();
  await codespacesCompute.toogleMachine();
  const status = await codespacesCompute.getMachineStatus();
  const codespacesSensor = CodespacesSensor.getInstance();
  await codespacesSensor.sendState(status);
  return c.json({ status });
});

app.get("/cron", async (c) => {
  // Codespaces Sensor Update
  const codespacesComputeEngineMachine = CodespacesComputeEngineMachine.getInstance();
  const codespacesSensor = CodespacesSensor.getInstance();
  const status = await codespacesComputeEngineMachine.getMachineStatus();
  await codespacesSensor.sendState(status);

  return c.json({ status: "ok" });
});

Deno.serve(
  {
    port: parseInt(port),
    hostname: IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : undefined,
  },
  app.fetch
);
