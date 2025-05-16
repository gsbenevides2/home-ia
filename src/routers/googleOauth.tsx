import { type Request, type Response, Router } from "express";
import { renderToString } from "react-dom/server";
import { OauthClient } from "../clients/google/OauthClient";
import GoogleLoginMessage from "../frontend/pages/GoogleLoginMessage.tsx";

const googleOauthRouter = Router();
const oauthClient = OauthClient.getInstance();

googleOauthRouter.get(
  oauthClient.staterUrl.pathname,
  async (req: Request, res: Response) => {
    await oauthClient.handleOauthUrl(req, res);
  },
);

googleOauthRouter.get(
  oauthClient.redirectUri.pathname,
  async (req: Request, res: Response) => {
    await oauthClient
      .handleOauthRedirect(req)
      .then(async () => {
        const html = await renderToString(
          <GoogleLoginMessage message="Success. Close this tab. You don't need to do anything else." />,
        );
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      })
      .catch(async () => {
        const html = await renderToString(
          <GoogleLoginMessage message="Error. Close this tab. And try again." />,
        );
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      });
  },
);

export default googleOauthRouter;
