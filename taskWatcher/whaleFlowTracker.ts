// trackWhaleActivity.ts

import pLimit from "p-limit"
import { fetchWhaleTransfers, resolveTokenMeta, ConnectionError } from "@/solto/core/whaleRadar"
import { z } from "zod"

// Zod schema for payload validation
export const WhaleTrackerSchema = z.object({
  walletList: z.array(z.string().min(32)).min(1),
  tokenFilter: z.string().min(1).optional(),
  concurrency: z.number().int().positive().default(5),
})

export type WhaleTrackerPayload = z.infer<typeof WhaleTrackerSchema>

export interface TrackedTransfer {
  wallet: string
  token: string
  amount: number
  direction: "IN" | "OUT"
  timestamp: string
}

export interface WhaleActivityReport {
  trackedWallets: number
  totalTransfers: number
  enrichedTransfers: TrackedTransfer[]
  tokenMetadata: Record<string, unknown>[]
  errors: string[]
}

/**
 * Tracks whale transfers across wallets, with optional token filtering.
 * Validates payload, limits concurrency, and enriches with metadata.
 */
export async function trackWhaleActivity(raw: unknown): Promise<WhaleActivityReport> {
  // Validate input payload
  const { walletList, tokenFilter, concurrency } = WhaleTrackerSchema.parse(raw)

  const limit = pLimit(concurrency)
  const errors: string[] = []

  // Fetch and filter transfers per wallet
  const movementsArrays = await Promise.all(
    walletList.map(wallet =>
      limit(async () => {
        try {
          const transfers = await fetchWhaleTransfers(wallet)
          return transfers
            .filter(tx => !tokenFilter || tx.token === tokenFilter)
            .map(tx => ({
              wallet,
              token: tx.token,
              amount: tx.amount,
              direction: tx.to === wallet ? "IN" : "OUT",
              timestamp: new Date(tx.timestamp * 1000).toISOString(),
            }))
        } catch (err: any) {
          const msg = err instanceof ConnectionError
            ? `Connection error for ${wallet}: ${err.message}`
            : `Error fetching transfers for ${wallet}: ${err.message}`
          errors.push(msg)
          return []
        }
      })
    )
  )

  const enrichedTransfers = movementsArrays.flat()
  const totalTransfers = enrichedTransfers.length

  // Enrich unique tokens metadata
  const uniqueTokens = Array.from(new Set(enrichedTransfers.map(t => t.token)))
  const tokenMetadata = await Promise.all(
    uniqueTokens.map(token =>
      limit(async () => {
        try {
          return await resolveTokenMeta(token)
        } catch (err: any) {
          errors.push(`Error resolving metadata for ${token}: ${err.message}`)
          return { token, error: err.message }
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
