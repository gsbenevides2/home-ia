declare module 'node-onvif' {
  export type ProfileList = Array<{
    token: string
    name: string
    snapshot: string
    stream: {
      udp: string
      http: string
      rtsp: string
    }
    video: {
      source: {
        token: string
        name: string
        bounds: {
          width: number
          height: number
          x: number
          y: number
        }
      }
      encoder: {
        token: string
        name: string
        resolution: {
          width: number
          height: number
        }
        quality: number
        framerate: number
        bitrate: number
        encoding: string
      }
    }
    audio: {
      source?: {
        token: string
        name: string
      }
      encoder?: {
        token: string
        name: string
        bitrate: number
        samplerate: number
        encoding: string
      }
    }
    ptz: {
      range: {
        x: {
          min: number
          max: number
        }
        y: {
          min: number
          max: number
        }
        z: {
          min: number
          max: number
        }
      }
    }
  }>

  export type PtzMove = {
    speed: {
      x: number
      y: number
      z: number
    }
    timeout: number
  }

  export type DeviceInfo = {
    Manufacturer: string
    Model: string
    FirmwareVersion: string
    SerialNumber: string
    HardwareId: string
  }

  interface OnvifDeviceConstructor {
    xaddr: string
  }

  export class OnvifDevice {
    constructor(options: OnvifDeviceConstructor)
    getProfileList(): ProfileList
    getUdpStreamUrl(): string
    ptzMove(ptzMove: PtzMove): void
    init(): Promise<DeviceInfo>
  }
}
