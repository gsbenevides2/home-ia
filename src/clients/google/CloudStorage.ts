import { Storage } from '@google-cloud/storage'
import { randomUUID } from 'node:crypto'
import { AuthCredentials } from './AuthCrendentials'

export class GoogleCloudStorage {
  private static instance: GoogleCloudStorage

  public static getInstance(): GoogleCloudStorage {
    return new GoogleCloudStorage()
  }

  private constructor() {}

  public async uploadFile(
    file: Buffer,
    fileName: string,
    bucketName: string
  ): Promise<string> {
    const { credentials, projectId } =
      AuthCredentials.getInstance().getCredentials()
    const storage = new Storage({
      credentials,
      projectId
    })
    const bucket = storage.bucket(bucketName)
    const blob = bucket.file(fileName)
    await blob.save(file)
    const downloadToken = randomUUID()
    await blob.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: downloadToken
      }
    })
    return this.createPersistentDownloadUrl(bucketName, fileName, downloadToken)
  }

  createPersistentDownloadUrl = (
    bucket: string,
    pathToFile: string,
    downloadToken: string
  ) => {
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
      pathToFile
    )}?alt=media&token=${downloadToken}`
  }
}
