import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Sentiment = "Neutral" | "Bullish" | "Bearish" | "Volatile" | "Unstable"

export interface PulseScannerWidgetProps {
  /** Polling interval in milliseconds (default: 10_000) */
  pollMs?: number
  /**
   * Optional async data source.
   * Should return either a Sentiment or { sentiment, confidence } (0..1).
   * If omitted, a deterministic simulator is used.
   */
  getSentiment?: () => Promise<Sentiment | { sentiment: Sentiment; confidence?: number }>
  /** Seed for deterministic simulator (default: based on day). */
  seed?: number
}

/** Deterministic PRNG (xorshift32) */
function makePrng(seed: number): () => number {
  let x = seed || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    // Convert to 0..1
    return ((x >>> 0) % 1_000_000) / 1_000_000
  }
}

/** Weighted pick helper */
function pickWeighted<T>(pairs: Array<[T, number]>, rnd: () => number): T {
  const total = pairs.reduce((s, [, w]) => s + (w > 0 ? w : 0), 0)
  if (total <= 0) return pairs[0][0]
  let r = rnd() * total
  for (const [val, w] of pairs) {
    if (w <= 0) continue
    if ((r -= w) <= 0) return val
  }
  return pairs[pairs.length - 1][0]
}

const ALL: Sentiment[] = ["Neutral", "Bullish", "Bearish", "Volatile", "Unstable"]

// Soft Markov-like transition weights to avoid wild jumps
const TRANSITIONS: Record<Sentiment, Array<[Sentiment, number]>> = {
  Neutral: [
    ["Neutral", 6],
    ["Bullish", 3],
    ["Bearish", 3],
    ["Volatile", 2],
    ["Unstable", 1],
  ],
  Bullish: [
    ["Bullish", 6],
    ["Neutral", 3],
    ["Volatile", 2],
    ["Unstable", 1],
    ["Bearish", 1],
  ],
  Bearish: [
    ["Bearish", 6],
    ["Neutral", 3],
    ["Volatile", 2],
    ["Unstable", 1],
    ["Bullish", 1],
  ],
  Volatile: [
    ["Volatile", 5],
    ["Unstable", 2],
    ["Neutral", 3],
    ["Bullish", 1],
    ["Bearish", 1],
  ],
  Unstable: [
    ["Unstable", 5],
    ["Volatile", 3],
    ["Neutral", 2],
    ["Bullish", 1],
    ["Bearish", 1],
  ],
}

const COLORS: Record<Sentiment, string> = {
  Neutral: "bg-gray-100 text-gray-800 border-gray-200",
  Bullish: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Bearish: "bg-rose-100 text-rose-800 border-rose-200",
  Volatile: "bg-amber-100 text-amber-800 border-amber-200",
  Unstable: "bg-indigo-100 text-indigo-800 border-indigo-200",
}

export default function PulseScannerWidget({
  pollMs = 10_000,
  getSentiment,
  seed,
}: PulseScannerWidgetProps) {
  const [sentiment, setSentiment] = useState<Sentiment>("Neutral")
  const [confidence, setConfidence] = useState<number | undefined>(undefined) // 0..1
  const [status, setStatus] = useState<"ok" | "error" | "idle">("idle")
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  // Pause updates when tab is hidden
  const isHiddenRef = useRef<boolean>(typeof document !== "undefined" ? document.hidden : false)
  useEffect(() => {
    const onVis = () => {
      isHiddenRef.current = document.hidden
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis)
      return () => document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  // Deterministic simulator (used when no getSentiment() provided)
  const simulate = useMemo(() => {
    const daySeed =
      seed ??
      // seed changes daily to avoid being completely static across reloads
      Math.floor(Date.now() / 86_400_000) ^ 0x9e3779b9
    const rnd = makePrng(daySeed)
    return (current: Sentiment): { sentiment: Sentiment; confidence?: number } => {
      const next = pickWeighted(TRANSITIONS[current], rnd)
      // confidence slightly higher when state persists, lower when flipping
      const conf =
        next === current ? 0.75 + rnd() * 0.2 : 0.45 + rnd() * 0.25
      return { sentiment: next, confidence: Math.min(1, Math.max(0, conf)) }
    }
  }, [seed])

  const loadOnce = useCallback(async () => {
    if (isHiddenRef.current) return
    try {
      setStatus("idle")
      let next: { sentiment: Sentiment; confidence?: number }
      if (getSentiment) {
        const res = await getSentiment()
        next = typeof res === "string" ? { sentiment: res } : res
      } else {
        next = simulate(sentiment)
      }
      if (ALL.includes(next.sentiment)) {
        setSentiment(next.sentiment)
        setConfidence(typeof next.confidence === "number" ? clamp01(next.confidence) : undefined)
        setUpdatedAt(Date.now())
        setStatus("ok")
      } else {
        throw new Error("invalid sentiment value")
      }
    } catch (e) {
      setStatus("error")
      // keep last sentiment, but mark stale
    }
    // schedule next tick with setTimeout (avoids overlap that setInterval can cause)
    schedule()
  }, [getSentiment, sentiment, simulate])

  // Self-scheduling timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void loadOnce()
    }, pollMs)
  }, [loadOnce, pollMs])

  useEffect(() => {
    void loadOnce() // immediate
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // mount once

  const badgeClass = `inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium border ${COLORS[sentiment]}`
  const barWidth = Math.round((confidence ?? 0) * 100)

  return (
    <div className="border p-4 rounded-xl shadow bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg">Market Pulse</h2>
          <p className="text-xs text-gray-500">
            {updatedAt ? `Updated ${timeAgo(updatedAt)}` : "Initializing…"}
            {status === "error" && (
              <span className="ml-2 text-rose-600">• data source error</span>
            )}
            {isHiddenRef.current && (
              <span className="ml-2 text-amber-600">• paused (tab hidden)</span>
            )}
          </p>
        </div>
        <button
          onClick={() => void loadOnce()}
          className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
          aria-label="Refresh sentiment"
        >
          Refresh
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2" aria-live="polite">
        <span className="text-sm text-gray-600">Current sentiment:</span>
        <span className={badgeClass}>{sentiment}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Confidence</span>
          <span>{confidence != null ? `${barWidth}%` : "n/a"}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-md overflow-hidden">
          <div
            className="h-full bg-gray-800 transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Polling every {Math.round(pollMs / 1000)}s
      </p>
    </div>
  )
}

/* ------------------------------- helpers ------------------------------- */

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x))
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}
