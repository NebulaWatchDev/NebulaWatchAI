interface TokenMetrics {
  tokenAddress: string
  symbol: string
  priceUsd: number
  volume24h: number
  liquidityUsd: number
  priceChange24h: number
  isHot: boolean
  riskLevel: "Low" | "Medium" | "High"
}

const DEX_API = "https://api.dexscreener.com/latest/dex/pairs/solana"

export async function analyzeSolanaToken(tokenAddress: string): Promise<TokenMetrics | null> {
  const res = await fetch(`${DEX_API}/${tokenAddress}`)
  if (!res.ok) return null

  const data = await res.json()
  const pair = data?.pairs?.[0]
  if (!pair) return null

  const volume = parseFloat(pair.volume?.h24 || "0")
  const liquidity = parseFloat(pair.liquidity?.usd || "0")
  const price = parseFloat(pair.priceUsd || "0")
  const priceChange = parseFloat(pair.priceChange?.h24 || "0")

  const risk = computeRisk(volume, liquidity, priceChange)

  return {
    tokenAddress,
    symbol: pair.baseToken?.symbol || "UNKNOWN",
    priceUsd: price,
    volume24h: volume,
    liquidityUsd: liquidity,
    priceChange24h: priceChange,
    isHot: volume > 20000 && liquidity > 10000 && priceChange > 10,
    riskLevel: risk
  }
}

function computeRisk(volume: number, liquidity: number, change: number): "Low" | "Medium" | "High" {
  if (liquidity > 100000 && volume > 50000 && Math.abs(change) < 15) return "Low"
  if (liquidity > 10000 && volume > 10000) return "Medium"
  return "High"
}
