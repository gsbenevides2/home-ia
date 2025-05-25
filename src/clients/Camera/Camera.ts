import * as onvif from 'node-onvif'
import { HLSManager } from './HLSManager'

export class Camera {
  readonly hlsStream: HLSManager
  private onvifDevice: onvif.OnvifDevice
  readonly cameraName: string
  readonly ipAddress: string
  readonly port: number

  constructor(ipAddress: string, port: number, cameraName: string) {
    this.cameraName = cameraName
    this.ipAddress = ipAddress
    this.port = port
    this.hlsStream = new HLSManager(cameraName)
    this.onvifDevice = new onvif.OnvifDevice({
      xaddr: this.makeXAddr()
    })
  }

  async init() {
    await this.onvifDevice.init()
    const profileList = this.onvifDevice.getProfileList()
    const rtspUrl = profileList[0].stream.rtsp
    this.hlsStream.setRtspUrl(rtspUrl)
    await this.hlsStream.start()
  }

  private makeXAddr() {
    return `http://${this.ipAddress}:${this.port}/onvif/device_service`
  }

  getSnapshotUrl() {
    const profileList = this.onvifDevice.getProfileList()
    const snapshotUrl = profileList[0].snapshot
    return snapshotUrl
  }

  async up() {
    await this.onvifDevice.ptzMove({
      speed: {
        x: 0,
        y: 0.5,
        z: 0
      },
      timeout: 1
    })
  }
  async down() {
    await this.onvifDevice.ptzMove({
      speed: {
        x: 0,
        y: -0.5,
        z: 0
      },
      timeout: 1
    })
  }
  async left() {
    await this.onvifDevice.ptzMove({
      speed: {
        x: 0.5,
        y: 0,
        z: 0
      },
      timeout: 1
    })
  }
  async right() {
    await this.onvifDevice.ptzMove({
      speed: {
        x: -0.5,
        y: 0,
        z: 0
      },
      timeout: 1
    })
  }
}
