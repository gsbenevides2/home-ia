import axios from "axios";
import { type StatusReturn } from "./StatusTypes.ts";

type AtlassianStatusResponse = {
  page: {
    status: "UP" | "HASISSUES" | "UNDERMAINTENANCE";
  };
  activeIncidents?: Array<{
    status: "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED";
  }>;
};

/**
 * Fetches the status of an endpoint from the status pages made with the Instatus Statuspage service
 * @param {string} endpoint - The endpoint to fetch the status from
 * @return {Promise<StatusReturn>} - The status of the endpoint
 */
export async function fetchFromInstatusStatuspage(endpoint: string): Promise<StatusReturn> {
  const url = `https://${endpoint}/summary.json`;
  const response = await axios.get<AtlassianStatusResponse>(url);
  const isDown = response.data.page.status === "HASISSUES" || (response.data.activeIncidents && response.data.activeIncidents.length > 0);
  return isDown ? "DOWN" : "OK";
}
