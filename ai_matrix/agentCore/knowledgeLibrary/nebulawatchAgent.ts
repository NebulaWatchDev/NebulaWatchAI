import { SolanaClient } from "@/core/solana"
import { DexDataFetcher } from "@/core/dex"
import { RiskHeuristics } from "./aiHeuristicsModel"

interface TokenSignal {
  symbol: string
  mint: string
  liquidity: number
  txCount24h: number
  flagged: boolean
}

interface AgentInsight {
  score: number
  label: string
  reasons: string[]
  confidence: number
}

export class NebulaWatchAgent {
  private solana: SolanaClient
  private dex: DexDataFetcher
  private risk: RiskHeuristics

  constructor(solana: SolanaClient, dex: DexDataFetcher) {
    this.solana = solana
    this.dex = dex
    this.risk = new RiskHeuristics()
  }

  async analyzeToken(mint: string): Promise<AgentInsight> {
    const tokenMeta = await this.dex.fetchTokenMeta(mint)
    const txStats = await this.solana.getTokenTxStats(mint)
    const liquidity = await this.dex.getLiquidityInfo(mint)

    const score = this.risk.computeScore({
      mint,
      txCount: txStats.txCount24h,
      liquidity: liquidity.amount,
      holders: tokenMeta.holderCount,
      verified: tokenMeta.verified,
      creationDate: tokenMeta.creationDate,
    })

    const flagged = score > 80
    const reasons = this.risk.explain(score)

    return {
      score,
      label: flagged ? "🚨 Risky" : "✅ Healthy",
      reasons,
      confidence: this.risk.confidenceLevel(score)
    }
  }

  async watchTrendingTokens(): Promise<TokenSignal[]> {
    const trending = await this.dex.fetchTrendingTokens()
    const insights: TokenSignal[] = []

    for (const token of trending) {
      const insight = await this.analyzeToken(token.mint)
      insights.push({
        symbol: token.symbol,
        mint: token.mint,
        liquidity: token.liquidity,
        txCount24h: token.txCount24h,
        flagged: insight.score > 80
      })
    }

    return insights
  }
}
