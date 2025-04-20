import {
  BinarySensor,
  BinarySensorDeviceClass,
  type BinarySensorAttributes
} from '../AbstractEntities/BinarySensor'

type Sensor = BinarySensor<BinarySensorAttributes>
type MotionDetectionAreas = (typeof Camera.motionDetectionsAreas)[number]

interface CameraType {
  motionDetectionsAreas: readonly ['frente']
  motionDetectionSensor: Record<MotionDetectionAreas, Sensor>
  getMotionDetectionSensor: (name: MotionDetectionAreas) => Promise<boolean>
}

export const Camera: CameraType = {
  motionDetectionsAreas: ['frente'] as const,
  motionDetectionSensor: {
    frente: new BinarySensor(
      'binary_sensor.frente_motion_alarm',
      'binary_sensor.frente_motion_alarm',
      {
        device_class: BinarySensorDeviceClass.MOTION,
        friendly_name: 'Frente Motion Alarm'
      }
    )
  },

  async getMotionDetectionSensor(name: MotionDetectionAreas) {
    const sensor = this.motionDetectionSensor[name]
    const { state } = await sensor.getData()
    return state === 'on'
  }
}
