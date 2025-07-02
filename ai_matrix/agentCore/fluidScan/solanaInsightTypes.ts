export interface RiskScanPayload {
  tokenAddress: string
}

export interface RiskScanReport {
  token: string
  scanTime: string
  liquidityDrop: boolean
  sybilScore: number
  uniqueWallets: number
  volatilityScore: number
  classification: "Low" | "Moderate" | "High"
}

export interface TokenMetricSet {
  liquidityHistory: number[]
  volatility: number
  wallets: string[]
}

export interface SolanaInsightTag {
  label: string
  description: string
  priority: number
}

export const insightTags: SolanaInsightTag[] = [
  {
    label: "🕵️ Sybil Suspect",
    description: "Wallet clustering suggests suspicious coordination",
    priority: 3
  },
  {
    label: "💧 Liquidity Risk",
    description: "Significant liquidity reduction in 24h window",
    priority: 2
  },
  {
    label: "📉 High Volatility",
    description: "Token exhibits erratic price behavior",
    priority: 1
  }
]
