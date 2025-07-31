import { Logger } from '../../../logger'
import { Button } from '../AbstractEntities/Button'
import { Sensor } from '../AbstractEntities/Sensor'
import { Switch } from '../AbstractEntities/Switch'

export class MySensorsRouter {
  private cpuUsed = new Sensor(
    'sensor.tp_link_router_cpu_used',
    'sensor.tp_link_router_cpu_used',
    {
      friendly_name: 'TP-Link Router CPU used'
    }
  )

  private memoryUsed = new Sensor(
    'sensor.tp_link_router_memory_used',
    'sensor.tp_link_router_memory_used',
    {
      friendly_name: 'TP-Link Router Memory used'
    }
  )

  private totalClients = new Sensor(
    'sensor.tp_link_router_total_clients',
    'sensor.tp_link_router_total_clients',
    {
      friendly_name: 'TP-Link Router Total Clients'
    }
  )

  private dataFetchingSwitch = new Switch(
    'switch.router_data_fetching',
    'switch.router_data_fetching',
    {
      icon: 'mdi:connection',
      friendly_name: 'Router data fetching'
    }
  )

  private guestWifiSwitch = new Switch(
    'switch.guest_wifi_2_4g',
    'switch.guest_wifi_2_4g',
    {
      icon: 'mdi:wifi',
      friendly_name: 'Guest WIFI 2.4G'
    }
  )

  private downloadSpeedSensor = new Sensor(
    'sensor.speedtest_baixar',
    'sensor.speedtest_baixar',
    {
      friendly_name: 'Download Speed'
    }
  )

  private uploadSpeedSensor = new Sensor(
    'sensor.speedtest_carregar',
    'sensor.speedtest_carregar',
    {
      friendly_name: 'Upload Speed'
    }
  )

  private pingSensor = new Sensor(
    'sensor.speedtest_ping',
    'sensor.speedtest_ping',
    {
      friendly_name: 'Ping'
    }
  )

  private rebootButton = new Button('button.reboot', 'button.reboot')

  private async getCpuUsed() {
    Logger.info('MySensorsRouter', 'Getting CPU used')
    const cpuUsed = await this.cpuUsed.getData()
    Logger.info('MySensorsRouter', 'CPU used', { cpuUsed })
    return `${cpuUsed.state} %`
  }

  private async getMemoryUsed() {
    Logger.info('MySensorsRouter', 'Getting memory used')
    const memoryUsed = await this.memoryUsed.getData()
    Logger.info('MySensorsRouter', 'Memory used', { memoryUsed })
    return `${memoryUsed.state} %`
  }

  private async getTotalClients() {
    Logger.info('MySensorsRouter', 'Getting total clients')
    const totalClients = await this.totalClients.getData()
    Logger.info('MySensorsRouter', 'Total clients', { totalClients })
    return `${totalClients.state} clients`
  }

  private async getRouterDataFetching() {
    Logger.info('MySensorsRouter', 'Getting router data fetching')
    const dataFetching = await this.dataFetchingSwitch.getData()
    Logger.info('MySensorsRouter', 'Router data fetching', { dataFetching })
    return dataFetching.state === 'on' ? 'Enabled' : 'Disabled'
  }

  private async getGuestWifi() {
    Logger.info('MySensorsRouter', 'Getting guest wifi')
    const guestWifi = await this.guestWifiSwitch.getData()
    Logger.info('MySensorsRouter', 'Guest wifi', { guestWifi })
    return guestWifi.state === 'on' ? 'Enabled' : 'Disabled'
  }

  private async getDownloadSpeed() {
    Logger.info('MySensorsRouter', 'Getting download speed')
    const downloadSpeed = await this.downloadSpeedSensor.getData()
    Logger.info('MySensorsRouter', 'Download speed', { downloadSpeed })
    return `${downloadSpeed.state} Mbps`
  }

  private async getUploadSpeed() {
    Logger.info('MySensorsRouter', 'Getting upload speed')
    const uploadSpeed = await this.uploadSpeedSensor.getData()
    Logger.info('MySensorsRouter', 'Upload speed', { uploadSpeed })
    return `${uploadSpeed.state} Mbps`
  }

  private async getPing() {
    Logger.info('MySensorsRouter', 'Getting ping')
    const ping = await this.pingSensor.getData()
    Logger.info('MySensorsRouter', 'Ping', { ping })
    return `${ping.state} ms`
  }

  async enableGuestWifi() {
    Logger.info('MySensorsRouter', 'Enabling guest wifi')
    await this.guestWifiSwitch.turnOn()
  }

  async disableGuestWifi() {
    Logger.info('MySensorsRouter', 'Disabling guest wifi')
    await this.guestWifiSwitch.turnOff()
  }

  async reboot() {
    Logger.info('MySensorsRouter', 'Rebooting')
    await this.rebootButton.click()
  }

  async disableDataFetching() {
    Logger.info('MySensorsRouter', 'Disabling data fetching')
    await this.dataFetchingSwitch.turnOff()
  }

  async enableDataFetching() {
    Logger.info('MySensorsRouter', 'Enabling data fetching')
    await this.dataFetchingSwitch.turnOn()
  }

  async getRouterData() {
    Logger.info('MySensorsRouter', 'Getting router data')
    const [
      cpuUsed,
      memoryUsed,
      totalClients,
      dataFetching,
      guestWifi,
      downloadSpeed,
      uploadSpeed,
      ping
    ] = await Promise.all([
      this.getCpuUsed(),
      this.getMemoryUsed(),
      this.getTotalClients(),
      this.getRouterDataFetching(),
      this.getGuestWifi(),
      this.getDownloadSpeed(),
      this.getUploadSpeed(),
      this.getPing()
    ])
    Logger.info('MySensorsRouter', 'Router data', {
      cpuUsed,
      memoryUsed,
      totalClients,
      dataFetching,
      guestWifi,
      downloadSpeed,
      uploadSpeed,
      ping
    })
    return {
      cpuUsed,
      memoryUsed,
      totalClients,
      dataFetching,
      guestWifi,
      downloadSpeed,
      uploadSpeed,
      ping
    }
  }
}
