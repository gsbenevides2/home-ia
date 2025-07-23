export interface MQTTDeviceConfig {
  identifiers: string[]
  name: string
  model: string
  manufacturer: string
  sw_version: string
}

export interface MQTTSensorConfig {
  name: string
  unique_id: string
  device: MQTTDeviceConfig
  availability_topic: string
  payload_available: string
  payload_not_available: string
}

export interface MQTTButtonConfig extends MQTTSensorConfig {
  command_topic: string
}

export interface MQTTBinarySensorConfig extends MQTTSensorConfig {
  state_topic: string
  payload_on: string
  payload_off: string
}

export interface MQTTSensorDataConfig extends MQTTSensorConfig {
  state_topic: string
  unit_of_measurement?: string
  device_class?: string
  state_class?: string
}
