import { z, ZodError } from "zod"

export const TransferSchema = z.object({
  from: z
    .string()
    .length(44, "Invalid wallet address")
    .transform((s) => s.trim()),
  to: z
    .string()
    .length(44, "Invalid wallet address")
    .transform((s) => s.trim()),
  amount: z
    .union([z.number(), z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount")])
    .transform((val) => (typeof val === "string" ? Number(val) : val))
    .refine((n) => n > 0, "Amount must be positive"),
  tokenMint: z.string().length(44, "Invalid token mint address"),
  type: z.enum(["stake", "unstake", "mint", "burn", "transfer"]),
  timestamp: z
    .union([z.number(), z.string().regex(/^\d+$/, "Invalid timestamp")])
    .optional()
    .transform((t) => (t ? Number(t) : Date.now())),
})

export type TransferPayload = z.infer<typeof TransferSchema>

export function sanitizeAndValidateTransfer(input: unknown): TransferPayload {
  try {
    const parsed = TransferSchema.parse(input)
    console.info("[sanitizeAndValidateTransfer] Success", parsed)
    return parsed
  } catch (err) {
    if (err instanceof ZodError) {
      console.error(
        "[sanitizeAndValidateTransfer] Validation errors:",
        err.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
      )
    }
    throw err
  }
}

export function describeSchemaFields(): string[] {
  return Object.keys(TransferSchema.shape)
}
