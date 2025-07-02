interface TokenMetrics {
  token: string
  txCount: number
  flaggedTx: number
  abnormalRatio: number
}

export function detectSuspiciousTokens(metrics: TokenMetrics[], threshold = 0.25): string[] {
  return metrics
    .filter((m) => m.abnormalRatio > threshold)
    .map((m) => m.token)
}

export function summarizeAnomalies(metrics: TokenMetrics[]): Record<string, number> {
  return metrics.reduce((acc, m) => {
    acc[m.token] = m.flaggedTx
    return acc
  }, {} as Record<string, number>)
}
