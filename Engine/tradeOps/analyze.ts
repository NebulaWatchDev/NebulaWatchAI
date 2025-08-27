type Risk = "Low" | "Medium" | "High"

interface TokenMetrics {
  tokenAddress: string
  symbol: string
  priceUsd: number
  volume24h: number
  liquidityUsd: number
  priceChange24h: number
  isHot: boolean
  riskLevel: Risk
}

const DEX_API = "https://api.dexscreener.com/latest/dex/pairs/solana"

export interface AnalyzeOptions {
  /** Per-request timeout (ms). Default 8000 */
  timeoutMs?: number
  /** Retry attempts on network/5xx/429. Default 2 */
  retryAttempts?: number
  /** Linear backoff base (attempt N waits N * retryDelayMs). Default 400 */
  retryDelayMs?: number
  /** Optional User-Agent */
  userAgent?: string
}

/**
 * Analyze a Solana token using Dexscreener, choosing the most liquid pair.
 * Returns null if the token cannot be found.
 */
export async function analyzeSolanaToken(
  tokenAddress: string,
  opts: AnalyzeOptions = {}
): Promise<TokenMetrics | null> {
  if (!tokenAddress) throw new Error("tokenAddress is required")

  const timeoutMs = opts.timeoutMs ?? 8000
  const retryAttempts = opts.retryAttempts ?? 2
  const retryDelayMs = opts.retryDelayMs ?? 400

  const url = `${DEX_API}/${encodeURIComponent(tokenAddress)}`

  const headers: Record<string, string> = {}
  if (opts.userAgent) headers["user-agent"] = opts.userAgent

  const fetchOnce = async () => {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal, headers } as any)
      if (res.status === 429) throw new Error("Rate limited (429)")
      if (!res.ok) {
        // Some responses provide JSON error bodies; read text safely
        const text = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`)
      }
      return (await res.json()) as any
    } finally {
      clearTimeout(to)
    }
  }

  let data: any | null = null
  let lastErr: unknown
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      data = await fetchOnce()
      break
    } catch (e) {
      lastErr = e
      if (attempt < retryAttempts) {
        await sleep(retryDelayMs * (attempt + 1))
        continue
      }
    }
  }
  if (!data) {
    // eslint-disable-next-line no-console
    console.warn("[analyzeSolanaToken] fetch failed:", lastErr)
    return null
  }

  // Dexscreener may return { pair } or { pairs: [...] }
  const pairs: any[] = Array.isArray(data?.pairs)
    ? data.pairs
    : data?.pair
    ? [data.pair]
    : []

  if (!pairs.length) return null

  // Choose the most liquid pair to be robust
  const best = pairs
    .slice()
    .sort(
      (a, b) =>
        (toNum(b?.liquidity?.usd) ?? 0) - (toNum(a?.liquidity?.usd) ?? 0)
    )[0]

  const volume = toNum(best?.volume?.h24) ?? toNum(best?.volumeUsd24Hr) ?? 0
  const liquidity = toNum(best?.liquidity?.usd) ?? 0
  const price = toNum(best?.priceUsd) ?? 0
  const priceChange = toNum(best?.priceChange?.h24) ?? 0

  const risk = computeRisk(volume, liquidity, priceChange)

  return {
    tokenAddress,
    symbol: best?.baseToken?.symbol || "UNKNOWN",
    priceUsd: price,
    volume24h: volume,
    liquidityUsd: liquidity,
    priceChange24h: priceChange,
    isHot: volume > 20_000 && liquidity > 10_000 && priceChange > 10,
    riskLevel: risk,
  }
}

function computeRisk(volume: number, liquidity: number, change: number): Risk {
  if (liquidity > 100_000 && volume > 50_000 && Math.abs(change) < 15) return "Low"
  if (liquidity > 10_000 && volume > 10_000) return "Medium"
  return "High"
}

function toNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
