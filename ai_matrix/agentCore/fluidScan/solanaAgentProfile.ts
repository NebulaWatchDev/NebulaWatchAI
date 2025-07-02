import { SOLANA_ANALYSIS_TOOLS } from "./tools"
import { SOLANA_AGENT_GUIDE } from "./guide"
import type { AgentProfile } from "@/ai/core"

export const solanaTokenAgent: AgentProfile = {
  id: "NebulaWatch-token-agent",
  label: "NebulaWatch Token Agent",
  description: "AI agent for analyzing Solana token behavior and tracing wallet patterns",
  guide: SOLANA_AGENT_GUIDE,
  modules: SOLANA_ANALYSIS_TOOLS,
  inputs: {
    required: ["tokenAddress"],
    optional: ["timestamp", "metrics"]
  },
  outputs: {
    structure: "InsightReport",
    format: "JSON"
  },
  capabilities: [
    "Fetch on-chain token metrics",
    "Analyze wallet distribution",
    "Evaluate volatility and liquidity",
    "Tag suspicious token activity",
    "Highlight sybil-like behavior"
  ],
  tags: ["solana", "token", "ai", "detection"],
  version: "1.0.0",
  createdAt: new Date().toISOString()
}
