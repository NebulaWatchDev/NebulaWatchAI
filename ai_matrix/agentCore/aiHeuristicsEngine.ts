export interface TokenPattern {
  liquidityShift: number;
  walletConcentration: number;
  recentMints: number;
  txVelocity: number;
}

export function evaluateToken(pattern: TokenPattern): string {
  const { liquidityShift, walletConcentration, recentMints, txVelocity } = pattern;
  const riskScore = liquidityShift * 0.3 + walletConcentration * 0.4 + recentMints * 0.2 + txVelocity * 0.1;

  if (riskScore > 75) return "High Risk";
  if (riskScore > 50) return "Moderate Risk";
  return "Low Risk";
}

export function generateInsight(token: TokenPattern): Record<string, any> {
  const label = evaluateToken(token);
  return {
    status: label,
    analysisTime: new Date().toISOString(),
    volatilitySignal: token.txVelocity > 120,
    mintPressure: token.recentMints > 2
  };
}