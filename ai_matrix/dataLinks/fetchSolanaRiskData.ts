import axios from "axios"
import { mapToEndpoint } from "./apiRouteMapper"

export async function fetchRiskData(resource: string, query: Record<string, any>) {
  const endpoint = mapToEndpoint(resource)
  try {
    const response = await axios.post(endpoint, query)
    return response.data
  } catch (error) {
    console.error("Error fetching risk data:", error)
    throw error
  }
}