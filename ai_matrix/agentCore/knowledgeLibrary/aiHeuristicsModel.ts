interface RiskFactors {
  mint: string
  txCount: number
  liquidity: number
  holders: number
  verified: boolean
  creationDate: string
}

export class RiskHeuristics {
  private weights = {
    txCount: 0.3,
    liquidity: 0.25,
    holders: 0.2,
    verified: 0.1,
    recentCreationPenalty: 0.15
  }

  computeScore(factors: RiskFactors): number {
    let score = 0

    score += this.weights.txCount * Math.min(factors.txCount / 500, 1)
    score += this.weights.liquidity * Math.min(factors.liquidity / 10000, 1)
    score += this.weights.holders * Math.min(factors.holders / 1000, 1)
    score += this.weights.verified * (factors.verified ? 1 : 0)

    if (this.isRecentlyCreated(factors.creationDate)) {
      score -= this.weights.recentCreationPenalty
    }

    return Math.round(score * 100)
  }

  explain(score: number): string[] {
    const reasons: string[] = []
    if (score < 30) reasons.push("Low liquidity or volume")
    if (score > 80) reasons.push("High activity and liquidity")
    if (score >= 50 && score <= 80) reasons.push("Moderate presence with mixed signals")
    return reasons
  }

  confidenceLevel(score: number): number {
    if (score > 85) return 0.95
    if (score > 60) return 0.85
    if (score > 40) return 0.7
    return 0.5
  }

  private isRecentlyCreated(dateStr: string): boolean {
    const created = new Date(dateStr).getTime()
    const now = Date.now()
    const delta = now - created
    return delta < 1000 * 60 * 60 * 24 * 7
  }
}
