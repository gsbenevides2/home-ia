import { Request, Response, Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { addToQueue, publicOperations } from "../queue/queue.ts";

const queueRouters = Router();

const queueBodySchema = z.object({
  operations: z.array(z.enum(publicOperations)),
});

type QueueBodyRequest = z.infer<typeof queueBodySchema>;

queueRouters.post(
  "/queue",
  validateRequest({
    body: queueBodySchema,
  }),
  (req: Request, res: Response) => {
    const { operations } = req.body as QueueBodyRequest;
    operations.forEach((operation) => {
      addToQueue(operation);
    });
    res.status(200).json({ message: "Operations received" });
  }
);

export default queueRouters;
