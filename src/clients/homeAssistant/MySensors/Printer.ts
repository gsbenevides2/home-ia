import { Sensor, type SensorAttributes } from '../AbstractEntities/Sensor'

type PrinterStates =
  | 'off'
  | 'ready'
  | 'scanning'
  | 'processing'
  | 'copying'
  | 'canceljob'
  | 'inpowersave'
  | 'unavailable'

type ConnectionStates = 'unavailable' | 'home' | 'not_home'

type PrinterColorAndPagesLevels = 'unavailable' | number

export class Printer {
  private readonly connectionSensor = new Sensor<
    ConnectionStates,
    SensorAttributes
  >('device_tracker.hp', 'device_tracker.hp', {
    friendly_name: 'HP'
  })

  private readonly printSensor = new Sensor<PrinterStates, SensorAttributes>(
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_status',
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_status',
    {
      friendly_name: 'HP Printer Status'
    }
  )

  private readonly colorCMYLevelSensor = new Sensor<
    PrinterColorAndPagesLevels,
    SensorAttributes
  >(
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_cyanmagentayellow_inkcartridge_nivel',
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_cyanmagentayellow_inkcartridge_nivel',
    {
      friendly_name: 'HP Printer Color Level'
    }
  )

  private readonly colorBlackLevelSensor = new Sensor<
    PrinterColorAndPagesLevels,
    SensorAttributes
  >(
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_black_inkcartridge_nivel',
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_black_inkcartridge_nivel',
    {
      friendly_name: 'HP Printer Color Level'
    }
  )

  private readonly pagesLevelSensor = new Sensor<
    PrinterColorAndPagesLevels,
    SensorAttributes
  >(
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_printer_paginas_totais',
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_printer_paginas_totais',
    {
      friendly_name: 'HP Printer Pages Level'
    }
  )

  private readonly scannerLevelSensor = new Sensor<
    PrinterColorAndPagesLevels,
    SensorAttributes
  >(
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_scanner_paginas_totais',
    'sensor.deskjet_ink_advantage_2700_all_in_one_printer_series_192_168_0_6_scanner_paginas_totais',
    {
      friendly_name: 'HP Scanner Pages Level'
    }
  )

  private async getPrinterStatus() {
    const printerStatus = await this.printSensor.getData()
    return printerStatus.state
  }

  private async getConnectionStatus() {
    const connectionStatus = await this.connectionSensor.getData()
    return connectionStatus.state
  }

  private async getPrinterColorAndPagesLevels(): Promise<{
    colorCMYLevel: string
    colorBlackLevel: string
    pagesLevel: string
    scannerLevel: string
  }> {
    const colorCMYLevel = await this.colorCMYLevelSensor.getData()
    const colorBlackLevel = await this.colorBlackLevelSensor.getData()
    const pagesLevel = await this.pagesLevelSensor.getData()
    const scannerLevel = await this.scannerLevelSensor.getData()

    return {
      colorCMYLevel:
        colorCMYLevel.state === 'unavailable'
          ? 'unavailable'
          : `${colorCMYLevel.state}%`,
      colorBlackLevel:
        colorBlackLevel.state === 'unavailable'
          ? 'unavailable'
          : `${colorBlackLevel.state}%`,
      pagesLevel:
        pagesLevel.state === 'unavailable'
          ? 'unavailable'
          : `${pagesLevel.state} páginas`,
      scannerLevel:
        scannerLevel.state === 'unavailable'
          ? 'unavailable'
          : `${scannerLevel.state} páginas`
    }
  }

  public async getAllPrinterStatus() {
    const [printerStatus, connectionStatus, colorCMYLevel] = await Promise.all([
      this.getPrinterStatus(),
      this.getConnectionStatus(),
      this.getPrinterColorAndPagesLevels()
    ])

    return {
      printerStatus,
      connectionStatus,
      ...colorCMYLevel
    }
  }
}
