import { Router } from 'express'
import console from 'node:console'
import { PLUGGY_ACCOUNTS_NAMES, PluggySingletonClient } from '../clients/Pluggy'

const pluggyRouter = Router()

pluggyRouter.post(
  '/services/pluggy/webhooks/update-account-data',
  (req, res) => {
    const body = req.body
    if (body.event === 'item/updated') {
      const accountName =
        PluggySingletonClient.getInstance().retriveAccountNameFromId(
          body.itemId
        )
      if (accountName) {
        PluggySingletonClient.getInstance().dispatchUpdateAccountData(
          accountName
        )
      }
    }
    res.send('OK')
  }
)

pluggyRouter.get(
  '/services/pluggy/get-account-data/:accountName',
  async (req, res) => {
    const accountName = req.params
      .accountName as (typeof PLUGGY_ACCOUNTS_NAMES)[number]
    console.log({ accountName })
    const accountData =
      await PluggySingletonClient.getInstance().getAccountData(accountName)
    console.log({ accountData })
    res.json(accountData)
  }
)

pluggyRouter.get(
  '/services/pluggy/get-account-transactions/:accountName',
  async (req, res) => {
    const accountName = req.params
      .accountName as (typeof PLUGGY_ACCOUNTS_NAMES)[number]
    const transactions =
      await PluggySingletonClient.getInstance().getAccountTransactions(
        accountName
      )
    res.json(transactions)
  }
)

pluggyRouter.post(
  '/services/pluggy/update-account-data/:accountName',
  async (req, res) => {
    const body = req.body
    const accountName = req.params
      .accountName as (typeof PLUGGY_ACCOUNTS_NAMES)[number]
    await PluggySingletonClient.getInstance().updateAccountData(accountName)
    res.send('OK')
  }
)
export default pluggyRouter
