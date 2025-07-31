import EventEmitter from 'events'
import { PluggyClient } from 'pluggy-sdk'
import { Logger } from '../../logger'

export const PLUGGY_ACCOUNTS_NAMES = ['Guilherme', 'Pai'] as const

export const PLUGGY_ACCOUNTS_IDS: Record<
  (typeof PLUGGY_ACCOUNTS_NAMES)[number],
  string
> = {
  Guilherme: process.env.PLUGGY_MY_ACCOUNT_ID!,
  Pai: process.env.PLUGGY_PAI_ACCOUNT_ID!
} as const

export class PluggySingletonClient {
  private static instance: PluggySingletonClient
  private constructor() {}

  public static getInstance(): PluggySingletonClient {
    if (!PluggySingletonClient.instance) {
      PluggySingletonClient.instance = new PluggySingletonClient()
    }
    return PluggySingletonClient.instance
  }

  client = new PluggyClient({
    clientId: process.env.PLUGGY_CLIENT_ID!,
    clientSecret: process.env.PLUGGY_CLIENT_SECRET!
  })

  eventEmitter = new EventEmitter()

  async getAccountData(accountName: (typeof PLUGGY_ACCOUNTS_NAMES)[number]) {
    Logger.info('PluggySingletonClient', 'Getting account data', {
      accountName
    })
    const accountData = await this.client.fetchAccounts(
      PLUGGY_ACCOUNTS_IDS[accountName]
    )
    Logger.info('PluggySingletonClient', 'Account data', { accountData })
    return accountData
  }

  async dispatchUpdateAccountData(
    accountName: (typeof PLUGGY_ACCOUNTS_NAMES)[number]
  ) {
    Logger.info('PluggySingletonClient', 'Dispatching update account data', {
      accountName
    })
    this.eventEmitter.emit(`updateAccountData-${accountName}`)
  }

  updateAccountData(accountName: (typeof PLUGGY_ACCOUNTS_NAMES)[number]) {
    Logger.info('PluggySingletonClient', 'Updating account data', {
      accountName
    })
    const accountId = PLUGGY_ACCOUNTS_IDS[accountName]
    return new Promise(resolve => {
      this.client.updateItem(accountId, undefined, {
        webhookUrl: process.env.PLUGGY_WEBHOOK_URL!,
        products: ['ACCOUNTS', 'TRANSACTIONS']
      })
      this.eventEmitter.on(`updateAccountData-${accountName}`, () => {
        this.eventEmitter.removeAllListeners(`updateAccountData-${accountName}`)
        resolve(true)
      })
    })
  }

  retriveAccountNameFromId(id: string) {
    return Object.entries(PLUGGY_ACCOUNTS_IDS).find(
      ([, value]) => value === id
    )?.[0] as (typeof PLUGGY_ACCOUNTS_NAMES)[number] | undefined
  }

  async getAccountTransactions(
    accountName: (typeof PLUGGY_ACCOUNTS_NAMES)[number]
  ) {
    Logger.info('PluggySingletonClient', 'Getting account transactions', {
      accountName
    })
    const accountData = await this.getAccountData(accountName)
    const transactions = await this.client.fetchTransactions(
      accountData.results[0].id,
      {
        pageSize: 4
      }
    )
    Logger.info('PluggySingletonClient', 'Account transactions', {
      transactions
    })
    return transactions
  }
}
