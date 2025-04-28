import { type Request, type Response, Router } from 'express'
import { OauthClient } from '../clients/google/OauthClient'

const googleOauthRouter = Router()
const oauthClient = OauthClient.getInstance()

googleOauthRouter.get(
  oauthClient.staterUrl.pathname,
  async (req: Request, res: Response) => {
    await oauthClient.handleOauthUrl(req, res)
  }
)

googleOauthRouter.get(
  oauthClient.redirectUri.pathname,
  async (req: Request, res: Response) => {
    await oauthClient.handleOauthRedirect(req, res)
  }
)

export default googleOauthRouter
