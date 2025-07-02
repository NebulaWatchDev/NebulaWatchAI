interface VaultRequest {
  vaultId: string
  operator: string
  intent: "lock" | "release" | "audit"
  tokenMint: string
  amount: number
}

interface VaultResponse {
  success: boolean
  action: string
  txId?: string
  error?: string
}

export class VaultRoutine {
  constructor(private endpoint: string) {}

  async execute(req: VaultRequest): Promise<VaultResponse> {
    try {
      const payload = this.prepare(req)
      const response = await fetch(`${this.endpoint}/vault/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error("Vault request failed")

      const result = await response.json()
      return { success: true, action: req.intent, txId: result.txId }
    } catch (err: any) {
      return { success: false, action: req.intent, error: err.message }
    }
  }

  private prepare(req: VaultRequest) {
    return {
      ...req,
      timestamp: Date.now(),
      nonce: Math.floor(Math.random() * 1e6)
    }
  }
}
