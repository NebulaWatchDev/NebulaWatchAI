export type ModuleKey = "scanner" | "analyzer" | "notifier" | "aggregator"

interface ModuleMeta {
  label: string
  enabled: boolean
  description: string
  version: string
}

const registry: Record<ModuleKey, ModuleMeta> = {
  scanner: {
    label: "Token Scanner",
    enabled: true,
    description: "Scans tokens for suspicious activity and metadata anomalies",
    version: "1.2.0"
  },
  analyzer: {
    label: "Risk Analyzer",
    enabled: true,
    description: "Performs in-depth risk computation across asset classes",
    version: "2.1.3"
  },
  notifier: {
    label: "Alert Notifier",
    enabled: false,
    description: "Delivers risk-based alerts and threshold signals",
    version: "0.9.4"
  },
  aggregator: {
    label: "Liquidity Aggregator",
    enabled: true,
    description: "Tracks multi-chain liquidity and transaction flows",
    version: "1.0.5"
  }
}

export function getModuleMeta(key: ModuleKey): ModuleMeta {
  return registry[key]
}

export function listEnabledModules(): ModuleKey[] {
  return Object.keys(registry).filter(
    (key) => registry[key as ModuleKey].enabled
  ) as ModuleKey[]
}

export function describeAllModules(): string[] {
  return Object.entries(registry).map(
    ([k, v]) => `${v.label} (${k}): ${v.description}`
  )
}
