interface DexTokenInfo {
  symbol: string
  priceUsd: number
  liquidityUsd: number
  volume24h: number
  fdv: number
  priceChange24h: number
  pairCreatedAt: number
}

const DEX_SCREENER_ENDPOINT = "https://api.dexscreener.com/latest/dex/pairs/solana"

export async function fetchDexTokenStats(tokenAddress: string): Promise<DexTokenInfo | null> {
  try {
    const res = await fetch(`${DEX_SCREENER_ENDPOINT}/${tokenAddress}`)
    if (!res.ok) return null

    const { pairs } = await res.json()
    const info = pairs?.[0]

    if (!info) return null

    return {
      symbol: info.baseToken?.symbol ?? "UNKNOWN",
      priceUsd: parseFloat(info.priceUsd ?? "0"),
      liquidityUsd: parseFloat(info.liquidity?.usd ?? "0"),
      volume24h: parseFloat(info.volume?.h24 ?? "0"),
      fdv: parseFloat(info.fdv ?? "0"),
      priceChange24h: parseFloat(info.priceChange?.h24 ?? "0"),
      pairCreatedAt: Number(info.pairCreatedAt ?? 0)
    }
  } catch (e) {
    console.error("Error fetching Dex token stats:", e)
    return null
  }
}
