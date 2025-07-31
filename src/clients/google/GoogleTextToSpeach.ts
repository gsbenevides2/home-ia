import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { Logger } from '../../logger'
import { AuthCredentials } from './AuthCrendentials'

export class GoogleTextToSpeach {
  private static instance: GoogleTextToSpeach

  public static getInstance(): GoogleTextToSpeach {
    return new GoogleTextToSpeach()
  }

  private constructor() {}

  public async textToSpeach(text: string): Promise<string> {
    Logger.info('GoogleTextToSpeach', 'Converting text to speech', { text })
    const { credentials, projectId } =
      AuthCredentials.getInstance().getCredentials()

    const client = new TextToSpeechClient({
      credentials,
      projectId,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      fallback: 'rest'
    })

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: 'pt-BR',
        name: 'pt-BR-Chirp3-HD-Achird'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        effectsProfileId: ['telephony-class-application'],
        pitch: 0,
        speakingRate: 1
      }
    })
    // Return the audio content as base64
    const base64 = Buffer.from(response.audioContent || '').toString('base64')
    return base64
  }
}
