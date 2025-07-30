import axios, { AxiosInstance, AxiosResponse } from "axios"
import { mapToEndpoint } from "./apiRouteMapper"

export interface FetchRiskOptions {
  /** Number of retry attempts on failure (default: 2) */
  retries?: number
  /** Base timeout per request in ms (default: 5000) */
  timeoutMs?: number
  /** Additional headers to include */
  headers?: Record<string, string>
  /** Hooks for instrumentation */
  hooks?: {
    onRequest?: (endpoint: string, query: Record<string, any>) => void
    onSuccess?: (data: any, attempt: number) => void
    onError?: (error: Error, attempt: number) => void
  }
}

const DEFAULT_OPTIONS: Required<Omit<FetchRiskOptions, "hooks">> & {
  hooks: Required<FetchRiskOptions["hooks"]>
} = {
  retries: 2,
  timeoutMs: 5000,
  headers: {},
  hooks: {
    onRequest: () => {},
    onSuccess: () => {},
    onError: () => {},
  },
}

/**
 * Fetch risk data for a given resource and query,
 * with retries, timeout, structured logging, and hooks.
 */
export async function fetchRiskData(
  resource: string,
  query: Record<string, any>,
  opts: FetchRiskOptions = {}
): Promise<any> {
  const { retries, timeoutMs, headers, hooks } = {
    ...DEFAULT_OPTIONS,
    ...opts,
    hooks: { ...DEFAULT_OPTIONS.hooks, ...(opts.hooks ?? {}) },
  }

  // Resolve endpoint or throw
  let endpoint: string
  try {
    endpoint = mapToEndpoint(resource)
  } catch (err: any) {
    console.error(`[fetchRiskData] Invalid resource "${resource}": ${err.message}`)
    throw err
  }

  // Create axios instance
  const client: AxiosInstance = axios.create({
    timeout: timeoutMs,
    headers: { "Content-Type": "application/json", ...headers },
  })

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.info(`[fetchRiskData] Requesting ${resource}`, { endpoint, attempt, timestamp: new Date().toISOString() })
      hooks.onRequest(endpoint, query)

      const response: AxiosResponse = await client.post(endpoint, query)

      console.info(`[fetchRiskData] Success`, { status: response.status, attempt })
      hooks.onSuccess(response.data, attempt)
      return response.data
    } catch (err: any) {
      console.warn(`[fetchRiskData] Attempt ${attempt} failed: ${err.message}`, { resource, attempt })
      hooks.onError(err, attempt)

      const canRetry = attempt <= retries && (err.code === "ECONNABORTED" || err.response?.status >= 500)
      if (canRetry) {
        const backoff = timeoutMs * attempt * 0.5
        console.info(`[fetchRiskData] Retrying in ${backoff}ms`)
        await new Promise((resolve) => setTimeout(resolve, backoff))
        continue
      }

      console.error(`[fetchRiskData] All attempts failed`, { resource, lastError: err.message })
      throw err
    }
  }

  // Should never reach
  throw new Error("fetchRiskData: unexpected exit")
}
