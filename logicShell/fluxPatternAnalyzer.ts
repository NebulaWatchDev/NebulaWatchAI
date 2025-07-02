// burstSignalDetector.ts

import axios from "axios"

interface TokenBurstSignal {
  token: string
  symbol: string
  volumeUSD: number
  liquidityUSD: number
  signalScore: number
}

export async function detectBurstSignals(): Promise<TokenBurstSignal[]> {
  const url = "https://api.dexscreener.com/latest/dex/pairs/solana"
  const res = await axios.get(url)
  const tokens = res.data.pairs || []

  return tokens
    .filter((t: any) => t.volume24hUSD > 50000 && t.priceChange.h1 > 0.15)
    .map((t: any) => ({
      token: t.pairAddress,
      symbol: t.baseToken.symbol,
      volumeUSD: t.volume24hUSD,
      liquidityUSD: t.liquidity.usd,
      signalScore: parseFloat((t.priceChange.h1 * 100).toFixed(2))
    }))
}
