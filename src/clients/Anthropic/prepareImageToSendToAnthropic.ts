import { createJimp } from '@jimp/core'
import jpeg from '@jimp/js-jpeg'
import png from '@jimp/js-png'
import * as resize from '@jimp/plugin-resize'
import { JimpMime } from 'jimp'
import JPEG from 'jpeg-js'

function makeNewJpegFormat() {
  const jpegFormat = jpeg()
  jpegFormat.decode = (data: Buffer) => {
    return JPEG.decode(data, { maxMemoryUsageInMB: 1024 })
  }
  return jpegFormat
}
const MyJimp = createJimp({
  plugins: [resize.methods],
  formats: [png, makeNewJpegFormat]
})

export async function prepareImageToSendToAnthropic(imageUrl: string) {
  try {
    const image = await MyJimp.read(imageUrl)

    const MAX_WIDTH = 8000
    const MAX_HEIGHT = 8000
    const MAX_SIZE = 1024 * 1024 * 5 // 5MB

    const originalWidth = image.width
    const originalHeight = image.height

    let newWidth = originalWidth
    let newHeight = originalHeight

    // Verifica se é necessário redimensionar
    if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
      let ratio = 1

      if (originalWidth > originalHeight) {
        ratio = MAX_WIDTH / originalWidth
      } else {
        ratio = MAX_HEIGHT / originalHeight
      }

      // Calcula as novas dimensões
      newWidth = Math.floor(originalWidth * ratio)
      newHeight = Math.floor(originalHeight * ratio)
    }
    let quality = 100
    let imageBuffer: Buffer | null = null
    while (true) {
      if (quality < 0) {
        throw new Error('Image size is too large')
      }
      imageBuffer = await image
        .resize({
          h: newHeight,
          w: newWidth
        })
        .getBuffer(JimpMime.jpeg, {
          quality
        })

      if (imageBuffer.length < MAX_SIZE) {
        break
      }
      quality -= 10
    }

    return {
      mimeType: JimpMime.jpeg,
      data: imageBuffer
    }
  } catch (error) {
    console.error('Erro ao processar a imagem base64:', error)
    throw error
  }
}
