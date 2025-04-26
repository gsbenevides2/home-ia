import { marked } from 'marked'
import nodemailer from 'nodemailer'
import { Tracer } from '../logger/Tracer'

interface EmailToSend {
  subject: string
  body: string
  to: string
}

export class EmailClient {
  private static instance: EmailClient
  private constructor() {}

  static getInstance() {
    if (!EmailClient.instance) {
      EmailClient.instance = new EmailClient()
    }
    return EmailClient.instance
  }

  async sendEmail(email: EmailToSend) {
    const { subject, body, to } = email
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env
    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
      throw new Error('Email credentials not found')
    }
    const tracer = Tracer.getGlobalTracer()
    tracer.setProgram('EmailClient')
    tracer.info(`Sending email to ${to}`, {
      subject,
      body,
      to
    })
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT),
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
      }
    })
    const html = await marked(body)
    const info = await transporter.sendMail({
      from: `"Assistente de IA" <${EMAIL_USER}>`,
      to, // list of receivers
      subject, // Subject line
      html // plain text body
    })

    tracer.info(`Email sent: ${info.messageId}`)
  }
}
