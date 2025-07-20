import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Account, PageResponse } from 'pluggy-sdk'
import { z } from 'zod'
import {
  PLUGGY_ACCOUNTS_NAMES,
  PluggySingletonClient
} from '../../../clients/Pluggy'
import { AbstractTool, type OnErrorToolCallback } from '../AbstractTool'

const args = {
  accountName: z.enum(PLUGGY_ACCOUNTS_NAMES)
} as const

type Args = typeof args

export class GetBankAccountDataTool extends AbstractTool<Args> {
  name = 'get-bank-account-data'
  description = 'Recupera os dados da conta bancária através do Pluggy'
  args = args

  onError: OnErrorToolCallback<Args> = error => {
    console.log('error', error)
    return {
      content: [
        {
          type: 'text',
          text: `Erro ao recuperar dados bancários: ${error.message}`
        }
      ],
      isError: true
    }
  }

  execute: ToolCallback<Args> = async args => {
    try {
      const pluggyClient = PluggySingletonClient.getInstance()
      await pluggyClient.updateAccountData(args.accountName)
      const accountData = await pluggyClient.getAccountData(args.accountName)

      const markdownData = this.formatAccountDataToMarkdown(accountData)

      return {
        content: [
          {
            type: 'text',
            text: markdownData
          }
        ],
        isError: false
      }
    } catch (error) {
      throw new Error(
        `Falha ao recuperar dados bancários: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private formatAccountDataToMarkdown(data: PageResponse<Account>): string {
    let markdown = '# 💰 Resumo Financeiro\n\n'

    if (!data.results || data.results.length === 0) {
      return markdown + '❌ Nenhuma conta encontrada.\n'
    }

    markdown += `📊 **Total de contas:** ${data.total}\n\n`

    data.results.forEach((account, index) => {
      markdown += `## ${index + 1}. ${account.name}\n\n`

      if (account.type === 'BANK') {
        markdown += this.formatBankAccount(account)
      } else if (account.type === 'CREDIT') {
        markdown += this.formatCreditAccount(account)
      }

      markdown += '---\n\n'
    })

    return markdown
  }

  private formatBankAccount(account: Account): string {
    let markdown = '🏦 **Conta Bancária**\n\n'

    markdown += `- **Proprietário:** ${account.owner}\n`
    markdown += `- **Número da conta:** ${account.number}\n`
    markdown += `- **CPF:** ${account.taxNumber}\n`
    markdown += `- **Saldo atual:** R$ ${account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`

    if (account.bankData && account.type === 'BANK') {
      markdown += '\n### 📈 Detalhes da Conta\n\n'
      markdown += `- **Número de transferência:** ${account.bankData.transferNumber}\n`
      if (account.bankData.closingBalance) {
        markdown += `- **Saldo de fechamento:** R$ ${account.bankData.closingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
      if (account.bankData.automaticallyInvestedBalance) {
        markdown += `- **Saldo investido automaticamente:** R$ ${account.bankData.automaticallyInvestedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
      const newBankData = account.bankData as unknown as {
        overdraftContractedLimit: number | null
      }
      if (newBankData.overdraftContractedLimit) {
        markdown += `- **Limite de cheque especial contratado:** R$ ${newBankData.overdraftContractedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
      if (account.bankData.overdraftUsedLimit) {
        markdown += `- **Limite de cheque especial usado:** R$ ${account.bankData.overdraftUsedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
      if (account.bankData.unarrangedOverdraftAmount) {
        markdown += `- **Valor de cheque especial não arranjado:** R$ ${account.bankData.unarrangedOverdraftAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
    }

    const newAccount = account as unknown as {
      updatedAt: string
    }

    markdown += `\n**Última atualização:** ${new Date(newAccount.updatedAt).toLocaleString('pt-BR')}\n\n`

    return markdown
  }

  private formatCreditAccount(account: Account): string {
    let markdown = '💳 **Cartão de Crédito**\n\n'

    markdown += `- **Proprietário:** ${account.owner}\n`
    markdown += `- **Número do cartão:** *${account.number}\n`
    markdown += `- **Saldo atual:** R$ ${account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`

    if (account.creditData && account.type === 'CREDIT') {
      const credit = account.creditData
      markdown += '\n### 💳 Detalhes do Cartão\n\n'
      markdown += `- **Bandeira:** ${credit.brand}\n`
      markdown += `- **Status:** ${credit.status}\n`
      if (credit.creditLimit) {
        markdown += `- **Limite total:** R$ ${credit.creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
      if (credit.availableCreditLimit) {
        markdown += `- **Limite disponível:** R$ ${credit.availableCreditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }
      if (credit.minimumPayment) {
        markdown += `- **Pagamento mínimo:** R$ ${credit.minimumPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      }

      if (credit.balanceDueDate) {
        markdown += `- **Data de vencimento:** ${new Date(credit.balanceDueDate).toLocaleDateString('pt-BR')}\n`
      }

      markdown += `- **Limite flexível:** ${credit.isLimitFlexible ? 'Sim' : 'Não'}\n`
    }
    const credit = account.creditData as unknown as {
      disaggregatedCreditLimits: {
        lineName: string
        limitAmount: number
        usedAmount: number
        availableAmount: number
      }[]
    }
    if (credit.disaggregatedCreditLimits.length > 0) {
      markdown += '\n### 📋 Limites Detalhados\n\n'

      // Agrupar por lineName para evitar repetição
      const groupedLimits = credit.disaggregatedCreditLimits.reduce(
        (acc, limit) => {
          if (!acc[limit.lineName]) {
            acc[limit.lineName] = limit
          }
          return acc
        },
        {} as Record<
          string,
          {
            lineName: string
            limitAmount: number
            usedAmount: number
            availableAmount: number
          }
        >
      )

      Object.values(groupedLimits).forEach(limit => {
        const lineName = this.translateLineName(limit.lineName)
        markdown += `**${lineName}:**\n`
        markdown += `- Usado: R$ ${limit.usedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        markdown += `- Limite: R$ ${limit.limitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        markdown += `- Disponível: R$ ${limit.availableAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`
      })
    }
    const newAccount = account as unknown as {
      updatedAt: string
    }
    markdown += `\n**Última atualização:** ${new Date(newAccount.updatedAt).toLocaleString('pt-BR')}\n\n`

    return markdown
  }

  private translateLineName(lineName: string): string {
    const translations: { [key: string]: string } = {
      CREDITO_A_VISTA: 'Crédito à Vista',
      SAQUE_CREDITO_BRASIL: 'Saque de Crédito (Brasil)',
      SAQUE_CREDITO_EXTERIOR: 'Saque de Crédito (Exterior)'
    }

    return translations[lineName] || lineName
  }
}
