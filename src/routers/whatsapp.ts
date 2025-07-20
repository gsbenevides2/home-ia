import { Elysia, t } from 'elysia'
import qrcode from 'qrcode'
import { WhatsAppClient } from '../clients/WhatsApp'
import { authService } from './authentication'

const whatsappRouter = new Elysia().use(authService).ws('/whatsapp', {
  body: t.Object({
    type: t.Enum({
      startConnection: 'start-connection',
      qrCode: 'qr-code',
      success: 'success'
    })
  }),
  response: t.Object({
    type: t.Enum({
      qrCode: 'qr-code',
      success: 'success'
    }),
    data: t.String()
  }),
  requireAuthentication: true,
  async message(ws, message) {
    console.log('message', message)
    const messageType = message.type
    const whatsAppInstance = await WhatsAppClient.getInstance(false)
    if (messageType === 'start-connection') {
      whatsAppInstance.authenticationEventEmmiter.on('qrCode', async qrCode => {
        const qrCodeText = await qrcode.toDataURL(qrCode, {
          type: 'image/png'
        })
        ws.send({
          type: 'qr-code',
          data: qrCodeText
        })
      })

      whatsAppInstance.authenticationEventEmmiter.on('success', () => {
        whatsAppInstance.release()
        ws.send({
          type: 'success',
          data: 'success'
        })
      })
      whatsAppInstance.connect()

      if (whatsAppInstance.qrCode) {
        const qrCodeText = await qrcode.toDataURL(whatsAppInstance.qrCode, {
          type: 'image/png'
        })
        ws.send({
          type: 'qr-code',
          data: qrCodeText
        })
      }
    }
  },

  async close() {
    const whatsAppInstance = await WhatsAppClient.getInstance(false)
    whatsAppInstance.release()
  }
})

export default whatsappRouter
