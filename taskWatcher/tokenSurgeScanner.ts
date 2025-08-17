import { getDexTrending, analyzeTokenBirth } from "@/solto/feeds/dexTrending"
import { z } from "zod"


export const SurgeScannerSchema = z.object({
  timeframe: z.enum(["1h", "6h", "24h"]).default("1h"),
  minLiquidityUSD: z.number().min(1000).default(2000),
})
export type SurgeScannerPayload = z.infer<typeof SurgeScannerSchema>


export interface EmergingToken {
  address: string
  symbol: string
  launchTimestamp: number
  liquidityUSD: number
  volatilityScore: number
  whaleBuys: number
  sentiment: string
  notes: string
}


export interface ScanResult {
  timeframe: string
  detected: number
  tokens: EmergingToken[]
}


export async function scanForEmergingTokens(
  rawPayload: Partial<SurgeScannerPayload>
): Promise<ScanResult> {
  const { timeframe, minLiquidityUSD } = SurgeScannerSchema.parse(rawPayload)

  const trending = await getDexTrending(timeframe)

  const now = Date.now()
  const freshTokens = trending.filter(token => {
    const ageMs = now - token.launchTimestamp * 1000
    const ageHours = ageMs / (1000 * 60 * 60)
    return ageHours < 24 && token.liquidityUSD >= minLiquidityUSD
  })

  const tokens: EmergingToken[] = []
  for (const token of freshTokens) {
    const behavior = await analyzeTokenBirth(token.address)
    const notes =
      behavior.whaleBuys > 3
        ? "⚠️ Whale interest detected"
        : "🟢 Organic distribution"

    tokens.push({
      address: token.address,
      symbol: token.symbol,
      launchTimestamp: token.launchTimestamp,
      liquidityUSD: token.liquidityUSD,
      volatilityScore: behavior.volatility,
      whaleBuys: behavior.whaleBuys,
      sentiment: behavior.sentiment,
      notes,
    })
  }

  return {
    timeframe,
    detected: tokens.length,
    tokens,
  }
}
