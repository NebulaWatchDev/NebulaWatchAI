import fetch from "node-fetch"

export interface TokenBalance {
  tokenAddress: string
  amount: string
  decimals: number
  uiAmount: number
  symbol?: string
}

export class BalanceFetcher {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async fetchBalances(walletAddress: string): Promise<TokenBalance[]> {
    const url = `${this.endpoint}/wallet/${walletAddress}/balances`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch balances")

    const data = await res.json()
    return data.tokens.map((t: any) => ({
      tokenAddress: t.mint,
      amount: t.raw,
      decimals: t.decimals,
      uiAmount: parseFloat(t.raw) / 10 ** t.decimals,
      symbol: t.symbol ?? undefined
    }))
  }

  async filterByMinimum(
    wallet: string,
    threshold: number
  ): Promise<TokenBalance[]> {
    const balances = await this.fetchBalances(wallet)
    return balances.filter((b) => b.uiAmount >= threshold)
  }

  async groupBySymbol(wallet: string): Promise<Record<string, TokenBalance[]>> {
    const balances = await this.fetchBalances(wallet)
    return balances.reduce((acc, b) => {
      if (!b.symbol) return acc
      acc[b.symbol] = acc[b.symbol] || []
      acc[b.symbol].push(b)
      return acc
    }, {} as Record<string, TokenBalance[]>)
  }
}
