import axios, { AxiosRequestConfig } from "axios"

export interface TokenMomentum {
  symbol: string
  liquidityUSD: number
  /** Percentage (e.g., 5.23 for +5.23%) */
  changeRatio: number
}

export type MomentumWindow = "m5" | "h1" | "h6" | "h24" | "d1"

export interface TrackMomentumOptions {
  /** Chain segment for DexScreener endpoint. Default: "solana" */
  chain?: string
  /** Percentage threshold, e.g., 5 means +5% or more. Default: 5 */
  minChangePct?: number
  /** Minimum liquidity in USD to include. Default: 0 (no filter) */
  minLiquidityUSD?: number
  /** Number of results to return after sorting. Default: 50 */
  limit?: number
  /** Which liquidityChange window to use. Default: "h1" */
  window?: MomentumWindow
  /** Axios timeout per request (ms). Default: 10_000 */
  timeoutMs?: number
  /** Retry attempts for 429/5xx. Default: 2 */
  retries?: number
  /** Linear backoff base (ms). Wait = attempt * base. Default: 300 */
  backoffBaseMs?: number
  /** Optional User-Agent header */
  userAgent?: string
}

/**
 * Fetches DexScreener pairs and returns tokens with positive liquidity momentum.
 * Robust to API hiccups (timeout, retries, backoff) and dedupes by symbol.
 */
export async function trackMomentum(opts: TrackMomentumOptions = {}): Promise<TokenMomentum[]> {
  const chain = (opts.chain ?? "solana").trim()
  const minChangePct = Number.isFinite(opts.minChangePct) ? Number(opts.minChangePct) : 5
  const minLiquidityUSD = Number.isFinite(opts.minLiquidityUSD) ? Number(opts.minLiquidityUSD) : 0
  const limit = Math.max(1, Math.floor(opts.limit ?? 50))
  const window: MomentumWindow = (opts.window ?? "h1")
  const timeoutMs = Math.max(1000, Math.floor(opts.timeoutMs ?? 10_000))
  const retries = Math.max(0, Math.floor(opts.retries ?? 2))
  const backoffBaseMs = Math.max(0, Math.floor(opts.backoffBaseMs ?? 300))
  const userAgent = (opts.userAgent || "momentum-probe/1.0").trim()

  const pairs = await fetchPairsWithRetries(chain, {
    timeoutMs,
    retries,
    backoffBaseMs,
    userAgent
  })

  // Normalize, filter, sort
  type Norm = { symbol: string; liquidityUSD: number; changePct: number }
  const normalized: Norm[] = []

  for (const p of pairs) {
    const symbol = String(p?.baseToken?.symbol ?? "").toUpperCase()
    if (!symbol) continue

    const liq = toNumber(p?.liquidity?.usd)
    const rawChange = toNumber(p?.liquidityChange?.[window])
    if (!Number.isFinite(liq) || !Number.isFinite(rawChange)) continue

    // DexScreener returns ratio (e.g., 0.05 for +5%); convert to percentage
    const changePct = rawChange * 100
    if (liq < minLiquidityUSD) continue
    if (changePct < minChangePct) continue

    normalized.push({ symbol, liquidityUSD: liq, changePct })
  }

  // Deduplicate by symbol: keep the entry with highest liquidity
  const bestBySymbol = new Map<string, Norm>()
  for (const n of normalized) {
    const prev = bestBySymbol.get(n.symbol)
    if (!prev || n.liquidityUSD > prev.liquidityUSD) bestBySymbol.set(n.symbol, n)
  }

  // Sort by change desc, then liquidity desc; limit and map to output shape
  return Array.from(bestBySymbol.values())
    .sort((a, b) => (b.changePct - a.changePct) || (b.liquidityUSD - a.liquidityUSD))
    .slice(0, limit)
    .map<TokenMomentum>(n => ({
      symbol: n.symbol,
      liquidityUSD: round2(n.liquidityUSD),
      changeRatio: round2(n.changePct)
    }))
}

/* ------------------------------- internals ------------------------------- */

async function fetchPairsWithRetries(
  chain: string,
  cfg: { timeoutMs: number; retries: number; backoffBaseMs: number; userAgent: string }
): Promise<any[]> {
  const url = `https://api.dexscreener.com/latest/dex/pairs/${encodeURIComponent(chain)}`
  let attempt = 0
  let lastErr: unknown

  while (attempt <= cfg.retries) {
    attempt++
    try {
      const axiosCfg: AxiosRequestConfig = {
        method: "GET",
        url,
        timeout: cfg.timeoutMs,
        headers: {
          accept: "application/json",
          "user-agent": cfg.userAgent
        },
        // Let us handle status codes ourselves
        validateStatus: () => true
      }
      const res = await axios(axiosCfg)
      if (res.status >= 200 && res.status < 300) {
        const pairs = Array.isArray(res.data?.pairs) ? res.data.pairs : []
        return pairs
      }

      // Retry only for transient errors
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers?.["retry-after"])
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.round(retryAfter * 1000)
          : cfg.backoffBaseMs * attempt
        if (attempt <= cfg.retries) {
          await sleep(waitMs)
          continue
        }
      }

      throw new Error(`HTTP ${res.status}${res.data ? `: ${safeShort(JSON.stringify(res.data))}` : ""}`)
    } catch (e) {
      lastErr = e
      if (attempt > cfg.retries) break
      await sleep(cfg.backoffBaseMs * attempt)
    }
  }
  throw (lastErr instanceof Error ? lastErr : new Error(String(lastErr)))
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function round2(x: number): number {
  return Math.round(x * 100) / 100
}

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms))
}

function safeShort(s: string, max = 200): string {
  if (!s) return ""
  return s.length <= max ? s : s.slice(0, max) + "…"
}
