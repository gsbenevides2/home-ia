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
