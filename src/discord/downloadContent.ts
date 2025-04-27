export async function downloadAudioInBase64(audioUrl: string): Promise<{
  buffer: Buffer
  encoding: 'OGG_OPUS'
  sampleRateHertz: 48000
}> {
  const response = await fetch(audioUrl)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const encoding = 'OGG_OPUS' as const
  const sampleRateHertz = 48000 as const
  return { buffer, encoding, sampleRateHertz }
}

export async function downloadImageInBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}
