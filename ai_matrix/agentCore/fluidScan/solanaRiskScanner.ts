import { fetchTokenMetrics, detectSybilClusters, evaluateLiquidityDrop } from "./modules"
import type { RiskScanPayload, RiskScanReport } from "./types"

/**
 * Perform a structured risk scan on a Solana token
 * Focuses on liquidity deltas, wallet diversity, and suspicious movement
 */
export async function scanTokenRisk(payload: RiskScanPayload): Promise<RiskScanReport> {
  const metrics = await fetchTokenMetrics(payload.tokenAddress)
  const sybilScore = detectSybilClusters(metrics.wallets)
  const liquidityAlert = evaluateLiquidityDrop(metrics.liquidityHistory)

  const riskLevel = (sybilScore > 70 || liquidityAlert)
    ? "High"
    : metrics.wallets.length < 10
      ? "Moderate"
      : "Low"

  return {
    token: payload.tokenAddress,
    scanTime: new Date().toISOString(),
    liquidityDrop: liquidityAlert,
    sybilScore,
    uniqueWallets: metrics.wallets.length,
    volatilityScore: metrics.volatility,
    classification: riskLevel
  }
}
