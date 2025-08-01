// genesisTokenScanner.ts

import axios, { AxiosInstance } from "axios"
import pLimit from "p-limit"
import { z } from "zod"

const DexPairSchema = z.object({
  pairAddress: z.string().nonempty(),
  baseToken: z.object({ name: z.string().nonempty() }),
  pairCreatedAt: z.string().refine(s => !isNaN(Date.parse(s)), "Invalid date"),
  liquidity: z.number().nonnegative().optional(),
})

const DexResponseSchema = z.object({
  pairs: z.array(DexPairSchema),
})

export interface TokenCandidate {
  tokenAddress: string
  name: string
  createdAt: Date
}

export interface GenesisScanOptions {
  /** Maximum age in minutes to consider “new” (default: 30) */
  maxAgeMinutes?: number
  /** Minimum liquidity to filter out low-liquidity pairs (optional) */
  minLiquidity?: number
  /** Maximum number of parallel fetches (not used here but reserved) */
  concurrency?: number
}

const DEFAULT_OPTIONS: Required<Omit<GenesisScanOptions, 'concurrency'>> = {
  maxAgeMinutes: 30,
  minLiquidity: 0,
}

export async function scanNewTokens(
  opts: GenesisScanOptions = {}
): Promise<TokenCandidate[]> {
  const { maxAgeMinutes, minLiquidity } = { ...DEFAULT_OPTIONS, ...opts }
  const axiosClient: AxiosInstance = axios.create({
    baseURL: "https://api.dexscreener.com/latest/dex/pairs/solana",
    timeout: 10_000,
  })

  let data: unknown
  try {
    const res = await axiosClient.get("")
    data = res.data
  } catch (err: any) {
    throw new Error(`Failed to fetch pairs: ${err.message}`)
  }

  const parsed = DexResponseSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error("Unexpected API response structure")
  }

  const now = Date.now()
  return parsed.data.pairs
    .filter(pair => {
      const created = new Date(pair.pairCreatedAt).getTime()
      const ageMin = (now - created) / 60000
      if (ageMin > maxAgeMinutes) return false
      if (minLiquidity && (pair.liquidity ?? 0) < minLiquidity) return false
      return true
    })
    .map(pair => ({
      tokenAddress: pair.pairAddress,
      name: pair.baseToken.name,
      createdAt: new Date(pair.pairCreatedAt),
    }))
}
