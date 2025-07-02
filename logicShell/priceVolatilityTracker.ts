
import axios from "axios"

interface TokenMomentum {
  symbol: string
  liquidityUSD: number
  changeRatio: number
}

export async function trackMomentum(): Promise<TokenMomentum[]> {
  const url = "https://api.dexscreener.com/latest/dex/pairs/solana"
  const res = await axios.get(url)
  const pairs = res.data.pairs || []

  return pairs
    .filter((t: any) => t.liquidityChange?.h1 > 0.05)
    .map((t: any) => ({
      symbol: t.baseToken.symbol,
      liquidityUSD: t.liquidity.usd,
      changeRatio: parseFloat((t.liquidityChange.h1 * 100).toFixed(2))
    }))
}
