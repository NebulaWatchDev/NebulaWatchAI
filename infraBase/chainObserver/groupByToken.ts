interface TokenData {
  symbol: string
  volume24h: number
  priceChange: number
  txCount: number
  liquidityScore: number
}

export function evaluateTokenScore(token: TokenData): number {
  const { volume24h, priceChange, txCount, liquidityScore } = token
  return (
    0.4 * Math.log1p(volume24h) +
    0.3 * priceChange +
    0.2 * Math.sqrt(txCount) +
    0.1 * liquidityScore
  )
}

export function rankTokens(tokens: TokenData[]): { symbol: string; score: number }[] {
  return tokens
    .map((t) => ({ symbol: t.symbol, score: evaluateTokenScore(t) }))
    .sort((a, b) => b.score - a.score)
}
