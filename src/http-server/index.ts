import Fastify from "fastify";
import { CodespacesControllers } from "./controllers/codespaces.ts";
import { CronControllers } from "./controllers/cron.ts";

export class HTTPServer {
  private static instance: HTTPServer = new HTTPServer();
  private constructor() {}
  static getInstance() {
    return this.instance;
  }

  router = Fastify({
    logger: true,
    trustProxy: true,
  });

  async start() {
    this.makeRoutes();
    const port = Deno.env.get("PORT");
    const IS_GOOGLE_CLOUD_RUN = Deno.env.get("K_SERVICE") !== undefined;
    if (!port) {
      throw new Error("PORT not set");
    }
    await this.router.listen({
      port: parseInt(port),
      host: IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : undefined,
    });
  }

  private makeRoutes() {
    this.router.register(CronControllers);
    this.router.register(CodespacesControllers);
  }
}
