import { SpeechClient } from '@google-cloud/speech'
import type { google } from '@google-cloud/speech/build/protos/protos'
import { AuthCredentials } from './AuthCrendentials'

type AudioEncoding =
  keyof typeof google.cloud.speech.v1.RecognitionConfig.AudioEncoding

export class GoogleSpeachToText {
  private static instance: GoogleSpeachToText

  public static getInstance(): GoogleSpeachToText {
    return new GoogleSpeachToText()
  }

  private constructor() {}

  public async transcribeAudio(
    audio: Buffer,
    encoding: AudioEncoding = 'OGG_OPUS',
    sampleRateHertz: number = 48000,
    languageCode: string = 'pt-BR'
  ): Promise<string> {
    const { credentials, projectId } =
      AuthCredentials.getInstance().getCredentials()
    const client = new SpeechClient({
      credentials,
      projectId,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })
    const [response] = await client.recognize({
      audio: {
        content: audio
      },
      config: {
        languageCode,
        encoding,
        sampleRateHertz
      }
    })
    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n')
    return transcription ?? ''
  }
}
