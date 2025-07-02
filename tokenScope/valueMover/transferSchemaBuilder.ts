import { z } from "zod"

export const TransferSchema = z.object({
  from: z.string().length(44, "Invalid wallet address"),
  to: z.string().length(44, "Invalid wallet address"),
  amount: z.number().positive(),
  tokenMint: z.string().length(44),
  type: z.enum(["stake", "unstake", "mint", "burn", "transfer"]),
  timestamp: z.number().optional()
})

export type TransferPayload = z.infer<typeof TransferSchema>

export function validateTransfer(input: unknown): TransferPayload {
  const result = TransferSchema.safeParse(input)
  if (!result.success) {
    throw new Error("Transfer validation failed")
  }
  return result.data
}

export function sanitizeTransfer(raw: any): TransferPayload {
  return {
    from: raw.from.trim(),
    to: raw.to.trim(),
    amount: Number(raw.amount),
    tokenMint: raw.tokenMint,
    type: raw.type,
    timestamp: raw.timestamp ?? Date.now()
  }
}

export function describeSchemaFields(): string[] {
  return TransferSchema._def.shape()
    ? Object.keys(TransferSchema._def.shape())
    : []
}
