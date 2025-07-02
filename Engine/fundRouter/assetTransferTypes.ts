export type TransferMode = "direct" |  "streamed"

export interface BaseTransfer {
  id: string
  sender: string
  receiver: string
  token: string
  amount: number
  timestamp: number
  status: "pending" | "completed" | "failed"
}

export interface NFTTransfer extends BaseTransfer {
  metadataUri: string
  collectionId?: string
}

export interface BatchTransfer {
  batchId: string
  source: string
  recipients: Array<{
    address: string
    amount: number
  }>
  mint: string
  strategy: "equal" | "weighted"
  note?: string
}

export interface TransferLog {
  eventId: string
  type: TransferMode
  details: BaseTransfer | NFTTransfer | BatchTransfer
  executedAt: number
  error?: string
}
