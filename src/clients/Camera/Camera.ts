import * as onvif from 'node-onvif'
import { Logger } from '../../logger'
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
    Logger.info('Camera', 'Initializing camera', { ipAddress: this.ipAddress })
    await this.onvifDevice.init()
    const profileList = this.onvifDevice.getProfileList()
    Logger.info('Camera', 'Profile list', { profileList })
    const rtspUrl = profileList[0].stream.rtsp
    Logger.info('Camera', 'RTSP URL', { rtspUrl })
    this.hlsStream.setRtspUrl(rtspUrl)
    Logger.info('Camera', 'Starting HLS stream', { ipAddress: this.ipAddress })
    await this.hlsStream.start()
    Logger.info('Camera', 'HLS stream started', { ipAddress: this.ipAddress })
  }

  private makeXAddr() {
    return `http://${this.ipAddress}:${this.port}/onvif/device_service`
  }

  getSnapshotUrl() {
    Logger.info('Camera', 'Getting snapshot URL', { ipAddress: this.ipAddress })
    const profileList = this.onvifDevice.getProfileList()
    const snapshotUrl = profileList[0].snapshot
    return snapshotUrl
  }

  async up() {
    Logger.info('Camera', 'Moving up', { ipAddress: this.ipAddress })
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
    Logger.info('Camera', 'Moving down', { ipAddress: this.ipAddress })
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
    Logger.info('Camera', 'Moving left', { ipAddress: this.ipAddress })
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
    Logger.info('Camera', 'Moving right', { ipAddress: this.ipAddress })
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
