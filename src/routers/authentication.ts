import { type NextFunction, type Request, type Response, Router } from "express";
const authenticationRouter = Router();

authenticationRouter.use((req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (authorizationHeader === `Bearer ${Bun.env.AUTH_TOKEN}`) {
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

export default authenticationRouter;
