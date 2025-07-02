import type { DexTokenInfo } from "./fetchDexTokenStats"

interface SuspicionReport {
  token: string
  isSuspicious: boolean
  reasons: string[]
  suspicionScore: number
}

export function detectSuspiciousPatterns(info: DexTokenInfo): SuspicionReport {
  const reasons: string[] = []
  let score = 0

  const now = Date.now()
  const tokenAgeHours = (now - info.pairCreatedAt) / (1000 * 60 * 60)

  if (tokenAgeHours < 24 && info.volume24h > 100000) {
    reasons.push("High volume in first 24h")
    score += 2
  }

  if (info.priceChange24h > 300 || info.priceChange24h < -90) {
    reasons.push("Extreme price swing")
    score += 2
  }

  if (info.liquidityUsd < 2000) {
    reasons.push("Extremely low liquidity")
    score += 2
  }

  if (info.fdv > 1000000000) {
    reasons.push("Suspiciously high FDV")
    score += 1
  }

  if (info.symbol.toLowerCase().includes("elon") || info.symbol.toLowerCase().includes("ai")) {
    reasons.push("Buzzword in symbol")
    score += 1
  }

  const isSuspicious = score >= 4

  return {
    token: info.symbol,
    isSuspicious,
    reasons,
    suspicionScore: score
  }
}
