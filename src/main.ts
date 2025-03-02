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

app.use(async (ctx, next) => {
  await next();
  try {
    const method = ctx.req.method;
    const accept = ctx.req.header("Accept");
    const ua = ctx.req.header("User-Agent");
    const reqBody = await ctx.req.raw.clone().text();
    const resBody = await ctx.res.clone().text();
    const url = ctx.req.url;
    const status = ctx.res.status;

    console.log({ method, accept, url, status, ua, reqBody, resBody });
  } catch (e) {
    console.log(e);
  }

  return;
});

// Codespaces Compute Engine toogle
app.post("/codespaces", async (c) => {
  const codespacesCompute = await CodespacesComputeEngineMachine.getInstance();
  await codespacesCompute.toogleMachine();
  const status = await codespacesCompute.getMachineStatus();
  const codespacesSensor = CodespacesSensor.getInstance();
  await codespacesSensor.sendState(status);
  return c.json({ status });
});

// Cron job
app.get("/cron", async (c) => {
  console.log("Cron job started");
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
