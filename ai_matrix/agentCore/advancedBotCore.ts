// AdvancedBotCore.ts

export interface InsightRecord {
  insight: string
  [key: string]: unknown
}

export interface AdvancedBotOptions {
  /** Maximum number of records retained in memory (default 1000) */
  maxMemory?: number
  /** How many most-recent records to use when analyzing (default 10) */
  memoryDepth?: number
  /** Optional text normalizer for insights before storage/analysis */
  normalize?: (text: string) => string
}

/**
 * AdvancedBotCore
 * - Strong typing for training data
 * - Bounded memory with a ring-buffer strategy
 * - Safer analysis with normalization & empty-guarding
 * - Deterministic, explainable predict() with simple heuristics
 */
export class AdvancedBotCore {
  private memory: InsightRecord[] = []
  private readonly maxMemory: number
  private _memoryDepth: number
  private readonly normalize: (s: string) => string

  constructor(trainingData: InsightRecord[] = [], memoryDepth = 10, opts: AdvancedBotOptions = {}) {
    this.maxMemory = Math.max(1, Math.floor(opts.maxMemory ?? 1000))
    this._memoryDepth = Math.max(1, Math.floor(opts.memoryDepth ?? memoryDepth))
    this.normalize = opts.normalize ?? defaultNormalize

    // seed initial memory (normalized & truncated to cap)
    for (const rec of trainingData) {
      if (rec && typeof rec.insight === "string") {
        this.memory.push({ ...rec, insight: this.normalize(rec.insight) })
        if (this.memory.length > this.maxMemory) this.memory.shift()
      }
    }
  }

  /** Current memory depth used by analyze() */
  get memoryDepth(): number {
    return this._memoryDepth
  }

  /** Update memory depth at runtime (>=1) */
  set memoryDepth(n: number) {
    this._memoryDepth = Math.max(1, Math.floor(n))
  }

  /** Number of items currently in memory */
  get size(): number {
    return this.memory.length
  }

  /**
   * Analyze recent insights and produce a brief, readable summary.
   * (Signature kept as `string` for drop-in compatibility.)
   */
  analyze(input: string): string {
    const depth = Math.min(this._memoryDepth, this.memory.length)
    if (depth === 0) return "Advanced response based on deep memory: (no prior insights)"
    const recent = this.memory.slice(-depth).map(d => d.insight)

    // lightweight dedupe + trim + join
    const seen = new Set<string>()
    const summary = recent
      .map(s => s.trim())
      .filter(s => {
        if (!s) return false
        const key = s.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .join(" ")

    return `Advanced response based on deep memory: ${summary || "(empty)"}`
  }

  /**
   * Append a new record to memory; keeps memory bounded.
   * Accepts any shape that at least includes an `insight` string.
   */
  updateMemory(newData: { insight: string } & Record<string, unknown>): void {
    if (!newData || typeof newData.insight !== "string") return
    const normalized = this.normalize(newData.insight)
    this.memory.push({ ...newData, insight: normalized })
    if (this.memory.length > this.maxMemory) this.memory.shift()
  }

  /**
   * Deterministic prediction based on simple heuristics:
   * - Keyword cues in `input`
   * - Recent-memory sentiment indicators
   * - Entropy/length as a weak signal
   *
   * (Signature kept as `string` for compatibility.)
   */
  predict(input: string): string {
    const text = this.normalize(input)
    const score = this.computeRiskScore(text)

    if (score >= 70) return "Likely Manipulation Detected"
    if (score >= 40) return "Caution: Token is acting irregularly"
    return "Volatility Normal"
  }

  /* -------------------- internals -------------------- */

  private computeRiskScore(text: string): number {
    let score = 0

    // 1) Keyword-based signals
    const KEYS = [
      ["rug", 35],
      ["honeypot", 35],
      ["manipulat", 30],
      ["pump", 20],
      ["dump", 20],
      ["whale", 15],
      ["exploit", 30],
      ["sudden", 10],
      ["halt", 15],
      ["freeze", 15],
      ["unlock", 15],
    ] as const
    for (const [k, w] of KEYS) {
      if (text.includes(k)) score += w
    }

    // 2) Memory cues: if recent insights mention risk terms, bump score
    const depth = Math.min(this._memoryDepth, this.memory.length)
    const recent = this.memory.slice(-depth)
    for (const rec of recent) {
      const s = rec.insight
      if (s.includes("risk") || s.includes("alert") || s.includes("suspicious")) score += 5
      if (s.includes("whale") || s.includes("liquidity drain")) score += 5
    }

    // 3) Entropy/structure heuristic
    score += Math.min(10, Math.max(0, Math.floor(shannonEntropy(text) * 2)))

    // 4) Length burst heuristic
    if (text.length > 240) score += 5

    // cap to 100
    return Math.min(100, score)
  }
}

/* -------------------- helpers -------------------- */

function defaultNormalize(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim()
}

function shannonEntropy(s: string): number {
  if (!s) return 0
  const freq = new Map<string, number>()
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1)
  const len = s.length
  let H = 0
  for (const [, n] of freq) {
    const p = n / len
    H -= p * Math.log2(p)
  }
  return H // typically in [0, ~6] for text
}
