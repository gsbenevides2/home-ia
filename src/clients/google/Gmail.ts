import { google } from 'googleapis'
import { Logger } from '../../logger'
import { OauthClient } from './OauthClient'

export class GoogleGmail {
  private static instance: GoogleGmail

  public static getInstance(): GoogleGmail {
    if (!GoogleGmail.instance) {
      GoogleGmail.instance = new GoogleGmail()
    }
    return GoogleGmail.instance
  }

  private constructor() {}

  public async listEmails(args: {
    email: string
    maxResults?: number
    q?: string
    labelIds?: string[]
    includeSpamTrash?: boolean
  }) {
    Logger.info('GoogleGmail', 'Listing emails', { args })
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: args.maxResults || 10,
      q: args.q,
      labelIds: args.labelIds,
      includeSpamTrash: args.includeSpamTrash || false
    })

    if (!response.data.messages) {
      return []
    }

    // Get detailed information for each message
    const messages = await Promise.all(
      response.data.messages.map(async message => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        })
        return detail.data
      })
    )

    return messages
  }

  public async getEmailById(args: {
    email: string
    messageId: string
    format?: 'minimal' | 'full' | 'raw' | 'metadata'
  }) {
    Logger.info('GoogleGmail', 'Getting email by ID', { args })
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: args.messageId,
      format: args.format || 'full'
    })

    return response.data
  }

  public async markAsRead(args: { email: string; messageIds: string[] }) {
    Logger.info('GoogleGmail', 'Marking as read', { args })
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Remove the UNREAD label to mark as read
    const response = await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: args.messageIds,
        removeLabelIds: ['UNREAD']
      }
    })

    return response.data
  }

  public async markAsUnread(args: { email: string; messageIds: string[] }) {
    Logger.info('GoogleGmail', 'Marking as unread', { args })
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Add the UNREAD label to mark as unread
    const response = await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: args.messageIds,
        addLabelIds: ['UNREAD']
      }
    })

    return response.data
  }

  public async searchEmails(args: {
    email: string
    query: string
    maxResults?: number
  }) {
    Logger.info('GoogleGmail', 'Searching emails', { args })
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: args.query,
      maxResults: args.maxResults || 10
    })

    if (!response.data.messages) {
      return []
    }

    // Get detailed information for each message
    const messages = await Promise.all(
      response.data.messages.map(async message => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        })
        return detail.data
      })
    )

    return messages
  }

  public async getUnreadEmails(args: { email: string; maxResults?: number }) {
    Logger.info('GoogleGmail', 'Getting unread emails', { args })
    return this.listEmails({
      email: args.email,
      maxResults: args.maxResults,
      labelIds: ['UNREAD']
    })
  }

  public async getLabels(args: { email: string }) {
    Logger.info('GoogleGmail', 'Getting labels', { args })
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.labels.list({
      userId: 'me'
    })

    return response.data.labels || []
  }

  public async watchForNewEmails(args: {
    email: string
    topicName: string
    labelIds?: string[]
    labelFilterAction?: 'include' | 'exclude'
  }) {
    Logger.info('GoogleGmail', 'Watching for new emails', { args })
    const oauth2Client = await OauthClient.getInstance().getOauthClient(
      args.email
    )
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: args.topicName,
        labelIds: args.labelIds,
        labelFilterAction: args.labelFilterAction || 'include'
      }
    })

    return response.data
  }
}
