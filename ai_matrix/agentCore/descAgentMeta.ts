/**
 * Metadata descriptor for an AI agent operating in Solana diagnostics.
 */
export interface AgentMeta {
  /** Human-readable name of the agent */
  readonly name: string
  /** Classification or category of the agent */
  readonly type: string
  /** Semantic version of the module */
  readonly version: string
  /** Entity or team responsible for the agent */
  readonly author: string
  /** Last update date (ISO yyyy-MM-dd) */
  readonly updated: string
  /** Brief explanation of the module’s purpose */
  readonly description: string
  /** List of methods exposed for external invocation */
  readonly exposedMethods: readonly string[]
  /**
   * Returns a manifest record for registry and introspection.
   */
  manifest(): Readonly<{
    /** Unique identifier in the agent registry */
    id: string
    /** Registry namespace or pool name */
    registry: string
    /** Behavior classification for orchestration */
    behavior: string
  }>
}

/**
 * Implementation of the AgentMeta for Nebula Knowledge Agent.
 */
export const MetaDescriptor: AgentMeta = {
  name: "Nebula Knowledge Agent",
  type: "Solana Intelligence Module",
  version: "1.0.0",
  author: "NebulaWatch AI",
  updated: "2025-06-29",
  description:
    "High-level metadata descriptor for AI agents in Solana token diagnostics, powering registry logic, UI rendering, and live introspection.",
  exposedMethods: [
    "describeAgent()",
    "listCapabilities()",
    "summarizePerformance()",
  ] as const,

  manifest() {
    return Object.freeze({
      id: "agent_meta_001",
      registry: "nebulawatch_agent_pool",
      behavior: "adaptive/token-contextual",
    })
  },
}
