import { Hono } from "hono";
import { addToQueue, Operations } from "./queue.ts";

const port = Deno.env.get("PORT");
const IS_GOOGLE_CLOUD_RUN = Deno.env.get("K_SERVICE") !== undefined;
if (!port) {
  throw new Error("PORT not set");
}

const app = new Hono();

app.use(async (ctx, next) => {
  await next();
  try {
    const method = ctx.req.method;
    const accept = ctx.req.header("Accept");
    const ua = ctx.req.header("User-Agent");
    const authorization = ctx.req.header("Authorization");
    const reqBody = await ctx.req.raw.clone().text();
    const resBody = await ctx.res.clone().text();
    const url = ctx.req.url;
    const status = ctx.res.status;

    console.log("Request processed", { method, accept, url, status, ua, reqBody, resBody, authorization });
  } catch (e) {
    console.log(e);
  }

  return;
});

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
  const authorization = ctx.req.header("Authorization");
  if (!authorization) {
    return ctx.json({ error: "Authorization header is required" }, 401);
  }
  const token = authorization.split(" ")[1];
  if (token !== Deno.env.get("API_TOKEN")) {
    return ctx.json({ error: "Invalid token" }, 401);
  }
  await next();
});

// Codespaces Compute Engine toogle
app.post("/codespaces", (c) => {
  addToQueue(Operations.codespacesToggle);
  return c.json({ status: "Codespaces Compute Engine toogle" });
});

app.post("/codespaces/start", (c) => {
  addToQueue(Operations.codespacesStart);
  return c.json({ status: "Codespaces Compute Engine start" });
});

app.post("/codespaces/stop", (c) => {
  addToQueue(Operations.codespacesStop);
  return c.json({ status: "Codespaces Compute Engine stop" });
});

app.get("/codespaces/status", async (c) => {
  addToQueue(Operations.updateCodespacesSensor);
  return c.json({ status: "Codespaces Compute Engine status" });
});

// Cron job
app.get("/cron", (c) => {
  addToQueue(Operations.updateTrainSensors);
  addToQueue(Operations.updateCodespacesSensor);
  addToQueue(Operations.updatePageStatusSensors);
  return c.json({ status: "Cron job started" });
});

app.get("/cron/new", (c) => {
  addToQueue(Operations.updatePageStatusSensors);
  return c.json({ status: "ok" });
});

Deno.serve(
  {
    port: parseInt(port),
    hostname: IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : undefined,
  },
  app.fetch
);
