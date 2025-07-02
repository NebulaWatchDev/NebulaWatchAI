// dexPairFetcher.ts

import axios from "axios"

const DEX_API_URL = "https://api.dexscreener.com/latest/dex/solana"

interface DexPair {
  baseToken: { symbol: string; address: string }
  quoteToken: { symbol: string }
  priceUsd: string
  volume24h: string
  pairAddress: string
}

export async function fetchTopSolanaPairs(limit = 10): Promise<DexPair[]> {
  const res = await axios.get(DEX_API_URL)
  const pairs: DexPair[] = res.data.pairs || []
  return pairs.slice(0, limit)
}

export function printPairs(pairs: DexPair[]): void {
  pairs.forEach((pair, i) => {
    console.log(
      `${i + 1}. ${pair.baseToken.symbol}/${pair.quoteToken.symbol} - $${pair.priceUsd} (24h vol: ${pair.volume24h})`
    )
  })
}
