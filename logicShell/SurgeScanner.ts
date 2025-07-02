import axios from "axios"

interface TokenVolatility {
  symbol: string
  volatilityScore: number
  volumeUSD: number
}

export async function analyzeVolatility(): Promise<TokenVolatility[]> {
  const url = "https://api.dexscreener.com/latest/dex/pairs/solana"
  const res = await axios.get(url)
  const tokens = res.data.pairs || []

  return tokens
    .map((t: any) => {
      const volScore =
        Math.abs(t.priceChange.h1 || 0) +
        Math.abs(t.priceChange.h6 || 0) +
        Math.abs(t.priceChange.h24 || 0)
      return {
        symbol: t.baseToken.symbol,
        volatilityScore: parseFloat(volScore.toFixed(2)),
        volumeUSD: t.volume24hUSD
      }
    })
    .filter((t: any) => t.volatilityScore > 15)
}
