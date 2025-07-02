import { fetchWhaleTransfers, resolveTokenMeta } from "@/solto/core/whaleRadar"
import { z } from "zod"

export const WhaleTrackerSchema = z.object({
  walletList: z.array(z.string()).min(1),
  tokenFilter: z.string().optional()
})

export type WhaleTrackerPayload = z.infer<typeof WhaleTrackerSchema>

export async function trackWhaleActivity(payload: WhaleTrackerPayload) {
  const { walletList, tokenFilter } = payload

  const movements = await Promise.all(
    walletList.map(async wallet => {
      const transfers = await fetchWhaleTransfers(wallet)

      return transfers
        .filter(tx => !tokenFilter || tx.token === tokenFilter)
        .map(tx => ({
          wallet,
          token: tx.token,
          amount: tx.amount,
          direction: tx.to === wallet ? "IN" : "OUT",
          timestamp: new Date(tx.timestamp * 1000).toISOString()
        }))
    })
  )

  const flattened = movements.flat()

  const metadata = await Promise.all(
    [...new Set(flattened.map(tx => tx.token))].map(resolveTokenMeta)
  )

  return {
    trackedWallets: walletList.length,
    totalTransfers: flattened.length,
    enrichedTransfers: flattened,
    tokenMetadata: metadata
  }
}
