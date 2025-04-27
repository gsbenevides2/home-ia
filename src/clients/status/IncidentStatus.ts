import axios from 'axios'
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
  const url = `https://${endpoint}/proxy/${endpoint}`
  const response = await axios.get<IncidentIoStatusResponse>(url)
  const status =
    response.data.summary.affected_components.length > 0 ? 'DOWN' : 'OK'

  if (status === 'DOWN') {
    const incidents = await axios.get<IncidentsResponse>(
      `https://${endpoint}/proxy/${endpoint}/incidents`
    )
    const problemDescription =
      incidents.data.incidents[0].updates[0].message_string

    return {
      status,
      problemDescription
    }
  }

  return {
    status
  }
}
