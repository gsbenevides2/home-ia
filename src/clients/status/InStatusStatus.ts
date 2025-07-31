import axios from 'axios'
import { Logger } from '../../logger/index.ts'
import { type StatusReturn } from './StatusTypes.ts'

type AtlassianStatusResponse = {
  page: {
    status: 'UP' | 'HASISSUES' | 'UNDERMAINTENANCE'
  }
  activeIncidents?: Array<{
    status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED'
    name: string
  }>
}

/**
 * Fetches the status of an endpoint from the status pages made with the Instatus Statuspage service
 * @param {string} endpoint - The endpoint to fetch the status from
 * @return {Promise<StatusReturn>} - The status of the endpoint
 */
export async function fetchFromInstatusStatuspage(
  endpoint: string
): Promise<StatusReturn> {
  Logger.info('fetchFromInstatusStatuspage', 'Fetching status', { endpoint })
  const url = `https://${endpoint}/summary.json`
  const response = await axios.get<AtlassianStatusResponse>(url)
  Logger.info('fetchFromInstatusStatuspage', 'Status response', { response })
  const isDown =
    response.data.page.status === 'HASISSUES' ||
    (response.data.activeIncidents && response.data.activeIncidents.length > 0)

  if (isDown) {
    const problemDescription = response.data.activeIncidents?.[0]?.name ?? ''
    return {
      status: 'DOWN',
      problemDescription
    }
  }

  return {
    status: 'OK'
  }
}
