// dexPairFetcher.ts

import axios, { AxiosInstance } from "axios"
import axiosRetry from "axios-retry"

/**
 * Dexscreener REST base for Solana.
 * See: https://docs.dexscreener.com/ (public API, rate-limited)
 */
const DEX_API_URL = "https://api.dexscreener.com/latest/dex/solana"

/** Raw response shape (subset) */
interface RawDexPair {
  baseToken: { symbol?: string; address?: string }
  quoteToken: { symbol?: string }
  priceUsd?: string
  volume24h?: string
  pairAddress?: string
}

export interface DexPair {
  baseSymbol: string
  baseAddress: string
  quoteSymbol: string
  priceUsd: number
  volume24h: number
  pairAddress: string
}

export interface FetchPairsOptions {
  /** Min 24h volume (USD) filter */
  minVolume24h?: number
  /** Only include these quote symbols (e.g., ["USDC","SOL"]) */
  quoteSymbols?: string[]
  /** Only include these base symbols */
  baseSymbols?: string[]
  /** Request timeout (ms) */
  timeoutMs?: number
  /** Override retry attempts (default 3) */
  retries?: number
  /** Abort signal for cancellation */
  signal?: AbortSignal
  /** Sort field (default "volume24h") */
  sortBy?: "volume24h" | "priceUsd"
  /** Sort direction (default "desc") */
  sortDir?: "asc" | "desc"
}

/* ------------------------- axios instance with retry ------------------------- */

const DEFAULT_RETRIES = 3
const api: AxiosInstance = axios.create({
  // baseURL is not used because Dexscreener endpoints vary; keep absolute URL below.
  headers: { "User-Agent": "dex-pairs-fetcher/1.0" },
})

axiosRetry(api, {
  retries: DEFAULT_RETRIES,
  // Network, 5xx, 408/429
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    [408, 429].includes(err.response?.status ?? 0) ||
    (err.response?.status ?? 0) >= 500,
  retryDelay: (retryCount, error) => {
    // Exponential backoff with jitter
    const base = axiosRetry.exponentialDelay(retryCount, error)
    const jitter = Math.floor(Math.random() * 200)
    return base + jitter
  },
})

/* --------------------------------- helpers --------------------------------- */

function parseNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN
  return Number.isFinite(n) ? n : NaN
}

function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0
}

function normalizeSymbol(sym?: string): string {
  if (!sym) return "UNKNOWN"
  const t = sym.trim()
  return t.length ? t : "UNKNOWN"
}

function toDexPair(p: RawDexPair): DexPair | null {
  const price = parseNum(p.priceUsd)
  const volume = parseNum(p.volume24h)
  const baseSymbol = normalizeSymbol(p.baseToken?.symbol)
  const baseAddress = nonEmpty(p.baseToken?.address) ? p.baseToken!.address! : ""
  const quoteSymbol = normalizeSymbol(p.quoteToken?.symbol)
  const pairAddress = nonEmpty(p.pairAddress) ? p.pairAddress! : ""

  if (!Number.isFinite(price) || !Number.isFinite(volume)) return null
  if (!baseAddress || !pairAddress) return null

  return {
    baseSymbol,
    baseAddress,
    quoteSymbol,
    priceUsd: price,
    volume24h: volume,
    pairAddress,
  }
}

function applyFilters(pairs: DexPair[], opts?: FetchPairsOptions): DexPair[] {
  if (!opts) return pairs
  const { minVolume24h, quoteSymbols, baseSymbols } = opts
  return pairs.filter((p) => {
    if (typeof minVolume24h === "number" && p.volume24h < minVolume24h) return false
    if (Array.isArray(quoteSymbols) && quoteSymbols.length > 0 && !quoteSymbols.includes(p.quoteSymbol)) return false
    if (Array.isArray(baseSymbols) && baseSymbols.length > 0 && !baseSymbols.includes(p.baseSymbol)) return false
    return true
  })
}

function sortPairs(pairs: DexPair[], sortBy: "volume24h" | "priceUsd", dir: "asc" | "desc"): DexPair[] {
  const m = dir === "asc" ? 1 : -1
  return [...pairs].sort((a, b) => (a[sortBy] - b[sortBy]) * m)
}

/* ---------------------------------- API ---------------------------------- */

/**
 * Fetch Solana DEX pairs and return the top `limit` according to sorting and filters.
 * Backward compatible: you can call `fetchTopSolanaPairs(10)` as before.
 */
export async function fetchTopSolanaPairs(limit = 10, opts: FetchPairsOptions = {}): Promise<DexPair[]> {
  const {
    timeoutMs = 5000,
    retries = DEFAULT_RETRIES,
    signal,
    sortBy = "volume24h",
    sortDir = "desc",
  } = opts

  // Override retries per-call if needed
  axiosRetry(api, { retries })

  try {
    const response = await api.get<{ pairs?: RawDexPair[] }>(DEX_API_URL, {
      timeout: timeoutMs,
      signal,
    })

    const rawPairs = Array.isArray(response.data?.pairs) ? response.data!.pairs! : []

    const parsed = rawPairs
      .map(toDexPair)
      .filter((x): x is DexPair => x !== null)

    const filtered = applyFilters(parsed, opts)
    const sorted = sortPairs(filtered, sortBy, sortDir)
    return sorted.slice(0, Math.max(0, limit))
  } catch (err: any) {
    console.error("[dexPairFetcher] fetchTopSolanaPairs error:", err?.message ?? err)
    return []
  }
}

/**
 * Format pairs as printable rows (for console.table or logs).
 */
export function formatPairsTable(pairs: DexPair[]): Array<Record<string, string | number>> {
  return pairs.map((p, i) => ({
    "#": i + 1,
    Pair: `${p.baseSymbol}/${p.quoteSymbol}`,
    "Price (USD)": p.priceUsd.toFixed(6),
    "24h Volume": Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(p.volume24h),
    Address: p.pairAddress,
  }))
}

/**
 * Print DEX pairs in a table format.
 */
export function printPairs(pairs: DexPair[]): void {
  if (pairs.length === 0) {
    console.log("No pairs to display")
    return
  }
  console.table(formatPairsTable(pairs))
}
