import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { type Request, type Response, Router } from "express";
import { mcpServer, transports } from "../mcp/server.ts";
const mcpRouter = Router();

mcpRouter.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await mcpServer.connect(transport);
});

mcpRouter.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

export default mcpRouter;
