// trackWhaleActivity.ts

import pLimit from "p-limit"
import { fetchWhaleTransfers, resolveTokenMeta, ConnectionError } from "@/solto/core/whaleRadar"
import { z } from "zod"

/* --------------------------------- Schema -------------------------------- */

const base58Pubkey = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "invalid base58 address")

// Backward compatible + a bit stricter & more flexible:
// - walletList now validates base58 length
// - tokenFilter may be a single string or a non-empty list of strings
// - concurrency is clamped (1..50)
// - optional filters: minAmount, since (unix seconds), direction
export const WhaleTrackerSchema = z.object({
  walletList: z.array(base58Pubkey).min(1),
  tokenFilter: z
    .union([z.string().min(1), z.array(z.string().min(1)).nonempty()])
    .optional(),
  concurrency: z.number().int().positive().max(50).default(5),
  minAmount: z.number().nonnegative().optional().default(0),
  since: z.number().int().nonnegative().optional(), // unix seconds
  direction: z.enum(["IN", "OUT"]).optional(),
})

export type WhaleTrackerPayload = z.infer<typeof WhaleTrackerSchema>

/* --------------------------------- Types --------------------------------- */

export interface TrackedTransfer {
  wallet: string
  token: string
  amount: number
  direction: "IN" | "OUT"
  timestamp: string // ISO-8601
}

export interface WhaleActivityReport {
  trackedWallets: number
  totalTransfers: number
  enrichedTransfers: TrackedTransfer[]
  tokenMetadata: Record<string, unknown>[]
  errors: string[]
}

/* ------------------------------- Utilities ------------------------------- */

const toLowerSet = (xs: string[] = []) => new Set(xs.map(s => s.toLowerCase()))
const normToken = (t: string) => t?.trim().toLowerCase()

function dedupeTransfers(items: TrackedTransfer[]): TrackedTransfer[] {
  const seen = new Set<string>()
  const out: TrackedTransfer[] = []
  for (const t of items) {
    const key = `${t.wallet}|${t.token}|${t.direction}|${t.amount}|${t.timestamp}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 2,
  backoffBaseMs = 300
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const retryable = err instanceof ConnectionError
      if (!retryable || i === attempts) break
      // linear backoff
      await new Promise(res => setTimeout(res, backoffBaseMs * (i + 1)))
    }
  }
  throw (lastErr instanceof Error ? lastErr : new Error(String(lastErr)))
}

/* --------------------------------- Core ---------------------------------- */

/**
 * Tracks whale transfers across wallets with optional token/amount/time filters.
 * - Validates payload with Zod
 * - Limits concurrency with p-limit
 * - Retries transient connection errors deterministically
 * - Enriches with token metadata (deduped)
 * - Returns results sorted by timestamp (newest first)
 */
export async function trackWhaleActivity(raw: unknown): Promise<WhaleActivityReport> {
  // Validate & normalize input
  const { walletList, tokenFilter, concurrency, minAmount, since, direction } =
    WhaleTrackerSchema.parse(raw)

  const limit = pLimit(concurrency)
  const errors: string[] = []

  const tokenFilterSet =
    typeof tokenFilter === "string"
      ? toLowerSet([tokenFilter])
      : toLowerSet(tokenFilter ?? [])

  // Fetch & filter transfers per wallet
  const perWallet = await Promise.all(
    walletList.map(wallet =>
      limit(async () => {
        try {
          const transfers = await withRetry(() => fetchWhaleTransfers(wallet))
          // Expected shape of each tx (loosely): { token, amount, to, from, timestamp }
          const filtered = transfers
            .filter(tx => {
              // token filter (if any)
              if (tokenFilterSet.size) {
                const tokenOk = tokenFilterSet.has(normToken(tx.token))
                if (!tokenOk) return false
              }
              // minAmount filter
              if (minAmount && Math.abs(Number(tx.amount)) < minAmount) return false
              // since filter (assumes tx.timestamp is unix seconds)
              if (since && Number(tx.timestamp) < since) return false
              return true
            })
            .map(tx => {
              const dir: "IN" | "OUT" = tx.to === wallet ? "IN" : "OUT"
              return {
                wallet,
                token: tx.token,
                amount: Number(tx.amount),
                direction: dir,
                timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
              } as TrackedTransfer
            })

          // optional direction filter applied after mapping
          const dirFiltered = direction ? filtered.filter(f => f.direction === direction) : filtered
          return dirFiltered
        } catch (err: any) {
          const msg =
            err instanceof ConnectionError
              ? `Connection error for ${wallet}: ${err.message}`
              : `Error fetching transfers for ${wallet}: ${err?.message || String(err)}`
          errors.push(msg)
          return []
        }
      })
    )
  )

  // Flatten, dedupe, sort (newest first)
  const enrichedTransfers = dedupeTransfers(perWallet.flat()).sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  )
  const totalTransfers = enrichedTransfers.length

  // Enrich unique tokens metadata
  const uniqueTokens = Array.from(new Set(enrichedTransfers.map(t => t.token)))
  const tokenMetadata = await Promise.all(
    uniqueTokens.map(token =>
      limit(async () => {
        try {
          return await withRetry(() => resolveTokenMeta(token))
        } catch (err: any) {
          errors.push(`Error resolving metadata for ${token}: ${err?.message || String(err)}`)
          return { token, error: err?.message || String(err) }
        }
      })
    )
  )

  return {
    trackedWallets: walletList.length,
    totalTransfers,
    enrichedTransfers,
    tokenMetadata,
    errors,
  }
}
