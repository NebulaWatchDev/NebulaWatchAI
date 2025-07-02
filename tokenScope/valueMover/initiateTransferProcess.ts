import { validateTransfer, TransferPayload } from "./transferSchemaBuilder"

interface TransferResult {
  success: boolean
  txId?: string
  error?: string
}

export class TransferEngine {
  private networkEndpoint: string

  constructor(endpoint: string) {
    this.networkEndpoint = endpoint
  }

  async initiate(payload: unknown): Promise<TransferResult> {
    try {
      const data: TransferPayload = validateTransfer(payload)

      const tx = await this.sendTransferRequest(data)

      return { success: true, txId: tx }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  private async sendTransferRequest(data: TransferPayload): Promise<string> {
    const response = await fetch(`${this.networkEndpoint}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error("Network error during transfer")
    }

    const resJson = await response.json()
    return resJson.txId
  }
}
