import { getDexTrending, analyzeTokenBirth } from "@/solto/feeds/dexTrending"
import { z } from "zod"

export const SurgeScannerSchema = z.object({
  timeframe: z.enum(["1h", "6h", "24h"]).default("1h"),
  minLiquidityUSD: z.number().min(1000).default(2000)
})

export type SurgeScannerPayload = z.infer<typeof SurgeScannerSchema>

export async function scanForEmergingTokens(payload: SurgeScannerPayload) {
  const { timeframe, minLiquidityUSD } = payload
  const trending = await getDexTrending(timeframe)

  const freshTokens = trending.filter(token => {
    const ageHours = (Date.now() - token.launchTimestamp * 1000) / 3600000
    return ageHours < 24 && token.liquidityUSD >= minLiquidityUSD
  })

  const enriched = await Promise.all(
    freshTokens.map(async token => {
      const behavior = await analyzeTokenBirth(token.address)
      return {
        ...token,
        volatilityScore: behavior.volatility,
        whaleBuys: behavior.whaleBuys,
        sentiment: behavior.sentiment,
        notes:
          behavior.whaleBuys > 3
            ? "⚠️ Whale interest detected"
            : "🟢 Organic distribution"
      }
    })
  )

  return {
    timeframe,
    detected: enriched.length,
    tokens: enriched
  }
}
