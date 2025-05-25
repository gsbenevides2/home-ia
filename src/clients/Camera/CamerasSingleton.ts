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
    await Promise.all(Object.values(this.cameras).map(camera => camera.init()))
  }

  async getCamera(cameraName: CameraName) {
    if (!this.cameras[cameraName]) {
      return null
    }
    return this.cameras[cameraName]
  }

  async stopAll() {
    await Promise.all(
      Object.values(this.cameras).map(camera => camera.hlsStream.stop())
    )
  }

  getAvailableCameras() {
    return camerasNames
  }
}
