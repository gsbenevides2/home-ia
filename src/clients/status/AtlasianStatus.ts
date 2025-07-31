import axios from 'axios'
import { Logger } from '../../logger/index.ts'
import { type StatusReturn } from './StatusTypes.ts'

type AtlassianStatusResponse = {
  status: {
    indicator: 'none' | 'minor' | 'major' | 'critical'
  }
}

type AtlassianIncidentResponse = {
  incidents: {
    incident_updates: Array<{
      body: string
    }>
  }[]
}

/**
 * Fetches the status of an endpoint from the status pages made with the Atlassian Statuspage service
 * @param {string} endpoint - The endpoint to fetch the status from
 * @return {Promise<StatusReturn>} - The status of the endpoint
 */
export async function fetchFromAtlassianStatuspage(
  endpoint: string
): Promise<StatusReturn> {
  Logger.info('fetchFromAtlassianStatuspage', 'Fetching status', { endpoint })
  const url = `https://${endpoint}/api/v2/status.json`
  const response = await axios.get<AtlassianStatusResponse>(url)
  Logger.info('fetchFromAtlassianStatuspage', 'Status response', { response })

  const status = response.data.status.indicator === 'none' ? 'OK' : 'DOWN'

  if (status === 'DOWN') {
    const unresolvedIncidents = await axios.get<AtlassianIncidentResponse>(
      `https://${endpoint}/api/v2/incidents/unresolved.json`
    )
    Logger.info('fetchFromAtlassianStatuspage', 'Unresolved incidents', {
      unresolvedIncidents
    })
    const problemDescription =
      unresolvedIncidents.data.incidents[0].incident_updates[0].body

    return {
      status,
      problemDescription
    }
  }

  return {
    status
  }
}
