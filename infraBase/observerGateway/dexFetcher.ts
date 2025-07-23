// dexPairFetcher.ts

import axios, { AxiosInstance } from "axios"
import axiosRetry from "axios-retry"

const DEX_API_URL = "https://api.dexscreener.com/latest/dex/solana"

// Raw response shape
interface RawDexPair {
  baseToken: { symbol: string; address: string }
  quoteToken: { symbol: string }
  priceUsd: string
  volume24h: string
  pairAddress: string
}

export interface DexPair {
  baseSymbol: string
  baseAddress: string
  quoteSymbol: string
  priceUsd: number
  volume24h: number
  pairAddress: string
}

// Create an Axios instance with retry logic
const api: AxiosInstance = axios.create()
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: err => axiosRetry.isNetworkOrIdempotentRequestError(err) || err.response?.status! >= 500,
})

/**
 * Fetch top Solana DEX pairs, sorted by 24h volume descending.
 * @param limit - number of pairs to return
 */
export async function fetchTopSolanaPairs(limit = 10): Promise<DexPair[]> {
  try {
    const response = await api.get<{ pairs: RawDexPair[] }>(DEX_API_URL, {
      timeout: 5000,
    })

    const rawPairs = Array.isArray(response.data.pairs)
      ? response.data.pairs
      : []

    const parsed: DexPair[] = rawPairs
      .map(p => {
        const price = parseFloat(p.priceUsd)
        const volume = parseFloat(p.volume24h)
        if (isNaN(price) || isNaN(volume)) {
          throw new Error(`Invalid numeric data for pair ${p.pairAddress}`)
        }
        return {
          baseSymbol: p.baseToken.symbol,
          baseAddress: p.baseToken.address,
          quoteSymbol: p.quoteToken.symbol,
          priceUsd: price,
          volume24h: volume,
          pairAddress: p.pairAddress,
        }
      })
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit)

    return parsed
  } catch (err: any) {
    console.error("[dexPairFetcher] fetchTopSolanaPairs error:", err.message || err)
    return []
  }
}

/**
 * Print DEX pairs in a table format for easier reading.
 */
export function printPairs(pairs: DexPair[]): void {
  if (pairs.length === 0) {
    console.log("No pairs to display")
    return
  }

  console.table(
    pairs.map((p, i) => ({
      "#": i + 1,
      Pair: `${p.baseSymbol}/${p.quoteSymbol}`,
      "Price (USD)": p.priceUsd.toFixed(6),
      "24h Volume": p.volume24h.toLocaleString(),
      Address: p.pairAddress,
    }))
  )
}
