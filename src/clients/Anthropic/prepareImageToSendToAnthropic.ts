import sharp from 'sharp'
import { Logger } from '../../logger'

export async function prepareImageToSendToAnthropic(imageUrl: string) {
  Logger.info(
    'prepareImageToSendToAnthropic',
    'Preparing image to send to Anthropic',
    { imageUrl }
  )
  try {
    const imageDownBuffer = await fetch(imageUrl).then(res => res.arrayBuffer())
    // Load the image
    let sharpImage = sharp(imageDownBuffer)

    // Get image metadata
    const metadata = await sharpImage.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions')
    }

    const MAX_WIDTH = 8000
    const MAX_HEIGHT = 8000
    const MAX_SIZE = 1024 * 1024 * 5 // 5MB

    const originalWidth = metadata.width
    const originalHeight = metadata.height

    let newWidth = originalWidth
    let newHeight = originalHeight

    // Check if resizing is needed
    if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
      let ratio = 1

      if (originalWidth > originalHeight) {
        ratio = MAX_WIDTH / originalWidth
      } else {
        ratio = MAX_HEIGHT / originalHeight
      }

      // Calculate new dimensions
      newWidth = Math.floor(originalWidth * ratio)
      newHeight = Math.floor(originalHeight * ratio)

      // Apply resize
      sharpImage = sharpImage.resize(newWidth, newHeight)
    }

    let quality = 100
    let imageBuffer: Buffer

    // Progressively reduce quality until file size is below MAX_SIZE
    while (true) {
      if (quality < 0) {
        throw new Error('Image size is too large')
      }

      imageBuffer = await sharpImage.jpeg({ quality }).toBuffer()

      if (imageBuffer.length < MAX_SIZE) {
        break
      }

      quality -= 10
    }
    Logger.info(
      'prepareImageToSendToAnthropic',
      'Image prepared to send to Anthropic',
      { imageUrl }
    )
    return {
      mimeType: 'image/jpeg',
      data: imageBuffer
    }
  } catch (error) {
    Logger.error(
      'prepareImageToSendToAnthropic',
      'Error processing image:',
      error
    )
    throw error
  }
}
