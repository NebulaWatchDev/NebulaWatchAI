// genesisTokenScanner.ts

import axios from "axios"

interface TokenCandidate {
  tokenAddress: string
  name: string
  isNew: boolean
  createdAt: string
}

export async function scanNewTokens(): Promise<TokenCandidate[]> {
  const url = "https://api.dexscreener.com/latest/dex/pairs/solana"
  const res = await axios.get(url)
  const tokens = res.data.pairs || []

  return tokens
    .filter((t: any) => {
      const ageMinutes = (Date.now() - new Date(t.pairCreatedAt).getTime()) / 60000
      return ageMinutes < 30
    })
    .map((t: any) => ({
      tokenAddress: t.pairAddress,
      name: t.baseToken.name,
      isNew: true,
      createdAt: t.pairCreatedAt
    }))
}
