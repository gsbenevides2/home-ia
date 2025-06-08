import { Router } from 'express'
import { PluggySingletonClient } from '../clients/Pluggy'

const pluggyRouter = Router()

pluggyRouter.post('/pluggy/update-account-data', (req, res) => {
  const body = req.body
  if (body.event === 'item/updated') {
    const accountName =
      PluggySingletonClient.getInstance().retriveAccountNameFromId(body.itemId)
    if (accountName) {
      PluggySingletonClient.getInstance().dispatchUpdateAccountData(accountName)
    }
  }
  res.send('OK')
})

export default pluggyRouter
