export const SOLANA_AGENT_GUIDE = `
🤖 NebulaWatch Agent Guide

This AI agent is tailored for deep token analytics on the Solana blockchain. It processes token mint addresses, evaluates liquidity flows, volatility ranges, and wallet engagement behavior. 

Capabilities include:

• Token Resolution — validate and normalize token mint addresses
• Liquidity Scan — assess LP health, movement, and changes over 24h
• Volatility Analyzer — extract price movement indices and derive anomaly factors
• Wallet Engagement — analyze how smart wallets or sybil patterns affect token credibility
• Alert Generator — raise flags when suspicious or unusual behavior is found

Agent is stateless and uses deterministic feature computation.
It does not rely on external randomness and instead follows strict scan heuristics.
Recommended for projects building insights dashboards or token health scoring pipelines.

🔁 Frequency: Each invocation operates on supplied payload. No memory retained.

Expected JSON input:
{
  "tokenAddress": "SPLMintHere",
  "timestamp": "ISO string or omitted",
  "metrics": ["liquidity", "wallets", "volatility"]
}
`
