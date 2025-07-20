import { Elysia, t } from 'elysia'
import console from 'node:console'
import { PLUGGY_ACCOUNTS_NAMES, PluggySingletonClient } from '../clients/Pluggy'
import { authService } from './authentication'

const pluggyRouter = new Elysia({
  prefix: '/services/pluggy'
})
  .use(authService)
  .post(
    '/webhooks/update-account-data',
    async ({ body }) => {
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
      return 'OK'
    },
    {
      body: t.Object({
        event: t.String(),
        itemId: t.String()
      }),
      response: t.String()
    }
  )
  .get(
    '/get-account-data/:accountName',
    async ({ params }) => {
      const { accountName } = params
      console.log({ accountName })
      const accountData =
        await PluggySingletonClient.getInstance().getAccountData(
          accountName as (typeof PLUGGY_ACCOUNTS_NAMES)[number]
        )
      console.log({ accountData })
      return accountData
    },
    {
      params: t.Object({
        accountName: t.Enum(
          PLUGGY_ACCOUNTS_NAMES.reduce(
            (acc, name) => {
              acc[name] = name
              return acc
            },
            {} as Record<string, string>
          )
        )
      }),
      requireAuthentication: true
    }
  )
  .get(
    '/get-account-transactions/:accountName',
    async ({ params }) => {
      const { accountName } = params
      const transactions =
        await PluggySingletonClient.getInstance().getAccountTransactions(
          accountName as (typeof PLUGGY_ACCOUNTS_NAMES)[number]
        )
      return transactions
    },
    {
      params: t.Object({
        accountName: t.Enum(
          PLUGGY_ACCOUNTS_NAMES.reduce(
            (acc, name) => {
              acc[name] = name
              return acc
            },
            {} as Record<string, string>
          )
        )
      }),
      requireAuthentication: true
    }
  )
  .post(
    '/update-account-data/:accountName',
    async ({ params }) => {
      const { accountName } = params
      await PluggySingletonClient.getInstance().updateAccountData(
        accountName as (typeof PLUGGY_ACCOUNTS_NAMES)[number]
      )
      return 'OK'
    },
    {
      params: t.Object({
        accountName: t.Enum(
          PLUGGY_ACCOUNTS_NAMES.reduce(
            (acc, name) => {
              acc[name] = name
              return acc
            },
            {} as Record<string, string>
          )
        )
      }),
      response: t.String(),
      requireAuthentication: true
    }
  )

export default pluggyRouter
