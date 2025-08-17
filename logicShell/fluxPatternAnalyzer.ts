import axios from "axios"

export interface TokenBurstSignal {
  token: string
  symbol: string
  volumeUSD: number
  liquidityUSD: number
  signalScore: number
}

/**
 * Detects tokens with volume and price spike activity from DexScreener.
 * @param chain Blockchain network (e.g., 'solana', 'ethereum', 'arbitrum')
 * @param minVolume Minimum 24h USD volume to consider a burst
 * @param minChange Minimum 1h price increase (e.g., 0.15 for 15%)
 */
export async function detectBurstSignals(
  chain: string = "solana",
  minVolume: number = 50_000,
  minChange: number = 0.15
): Promise<TokenBurstSignal[]> {
  const url = `https://api.dexscreener.com/latest/dex/pairs/${chain}`

  try {
    const res = await axios.get(url)
    const tokens = Array.isArray(res.data?.pairs) ? res.data.pairs : []

    return tokens
      .filter((t: any) => {
        const volume = Number(t.volume24hUSD ?? 0)
        const change = Number(t?.priceChange?.h1 ?? 0)
        return volume > minVolume && change > minChange
      })
      .map((t: any): TokenBurstSignal => ({
        token: t.pairAddress ?? "",
        symbol: t.baseToken?.symbol ?? "N/A",
        volumeUSD: Number(t.volume24hUSD ?? 0),
        liquidityUSD: Number(t?.liquidity?.usd ?? 0),
        signalScore: Number((Number(t?.priceChange?.h1 ?? 0) * 100).toFixed(2))
      }))
  } catch (err) {
    console.error(`❌ Failed to fetch burst signals from ${chain}:`, err)
    return []
  }
}
