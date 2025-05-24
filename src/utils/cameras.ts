import { HLSManager } from './HLSManager'

export const CAMERAS = [
  {
    name: 'rua',
    snapshotUrl:
      'http://192.168.0.5/webcapture.jpg?command=snap&channel=0&user=admin&password=BleSnyB9',
    rtspUrl:
      'rtsp://admin:BleSnyB9@192.168.0.5:554/user=admin&password=BleSnyB9&channel=0&stream=0&onvif=0.sdp?real_stream'
  }
]

export const hlsManagers = CAMERAS.map(
  camera => new HLSManager(camera.name, camera.rtspUrl)
)

export const startAllHlsManagers = () => {
  return Promise.all(hlsManagers.map(hlsManager => hlsManager.start()))
}

export const stopAllHlsManagers = () => {
  return Promise.all(hlsManagers.map(hlsManager => hlsManager.stop()))
}
