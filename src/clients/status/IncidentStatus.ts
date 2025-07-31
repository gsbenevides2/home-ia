import axios from 'axios'
import { Logger } from '../../logger/index.ts'
import { type StatusReturn } from './StatusTypes.ts'

type IncidentIoStatusResponse = {
  summary: {
    affected_components: Array<unknown>
  }
}

type IncidentsResponse = {
  incidents: Array<{
    name: string
    updates: Array<{
      message_string: string
    }>
  }>
}

/**
 * Fetches the status of an endpoint from the status pages made with the Incident.io service
 * @param {string} endpoint - The endpoint to fetch the status from
 * @return {Promise<StatusReturn>} - The status of the endpoint
 */
export async function fetchFromIncidentIoStatus(
  endpoint: string
): Promise<StatusReturn> {
  Logger.info('fetchFromIncidentIoStatus', 'Fetching status', { endpoint })
  const url = `https://${endpoint}/proxy/${endpoint}`
  const response = await axios.get<IncidentIoStatusResponse>(url)
  Logger.info('fetchFromIncidentIoStatus', 'Status response', { response })
  const status =
    response.data.summary.affected_components.length > 0 ? 'DOWN' : 'OK'
  Logger.info('fetchFromIncidentIoStatus', 'Status', { status })
  if (status === 'DOWN') {
    const incidents = await axios.get<IncidentsResponse>(
      `https://${endpoint}/proxy/${endpoint}/incidents`
    )
    Logger.info('fetchFromIncidentIoStatus', 'Incidents response', {
      incidents
    })
    const problemDescription =
      incidents.data.incidents[0].updates[0].message_string
    Logger.info('fetchFromIncidentIoStatus', 'Problem description', {
      problemDescription
    })
    return {
      status,
      problemDescription
    }
  }

  return {
    status
  }
}
