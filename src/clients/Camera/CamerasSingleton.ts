import { Logger } from '../../logger'
import { Camera } from './Camera'

const camerasNames = ['rua'] as const

const camerasAndIps = {
  rua: {
    ipAddress: '192.168.0.5',
    port: 8899
  }
} as const

export type CameraName = keyof typeof camerasAndIps

type CamerasInstance = Record<CameraName, Camera>

export class Cameras {
  private static instance: Cameras
  private cameras: CamerasInstance = Object.fromEntries(
    Object.entries(camerasAndIps).map(([cameraName, { ipAddress, port }]) => [
      cameraName as CameraName,
      new Camera(ipAddress, port, cameraName)
    ])
  ) as CamerasInstance

  private constructor() {}

  static getInstance() {
    if (!Cameras.instance) {
      Cameras.instance = new Cameras()
    }
    return Cameras.instance
  }

  async initAll() {
    Logger.info('CamerasSingleton', 'Initializing all cameras')
    await Promise.all(Object.values(this.cameras).map(camera => camera.init()))
    Logger.info('CamerasSingleton', 'All cameras initialized')
  }

  async getCamera(cameraName: CameraName) {
    if (!this.cameras[cameraName]) {
      Logger.error('CamerasSingleton', 'Camera not found', { cameraName })
      return null
    }
    return this.cameras[cameraName]
  }

  async stopAll() {
    Logger.info('CamerasSingleton', 'Stopping all cameras')
    await Promise.all(
      Object.values(this.cameras).map(camera => camera.hlsStream.stop())
    )
    Logger.info('CamerasSingleton', 'All cameras stopped')
  }

  getAvailableCameras() {
    Logger.info('CamerasSingleton', 'Getting available cameras')
    return camerasNames
  }
}
