interface TransferInput {
  from: string
  to: string
  amount: number
  token: string
  memo?: string
}

interface TransferReceipt {
  success: boolean
  txId?: string
  timestamp: number
  error?: string
}

export class AssetTransferProcessor {
  constructor(private rpcUrl: string) {}

  async performTransfer(input: TransferInput): Promise<TransferReceipt> {
    try {
      const txId = await this.initiateTransfer(input)
      return {
        success: true,
        txId,
        timestamp: Date.now()
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        timestamp: Date.now()
      }
    }
  }

  private async initiateTransfer(input: TransferInput): Promise<string> {
    const body = {
      source: input.from,
      destination: input.to,
      token: input.token,
      value: input.amount,
      note: input.memo || "asset-transfer"
    }

    const res = await fetch(`${this.rpcUrl}/transfer/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error("Transfer rejected")

    const json = await res.json()
    return json.txId
  }
}
