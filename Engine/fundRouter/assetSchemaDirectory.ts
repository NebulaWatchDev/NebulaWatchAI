export type TransferKind = "token" | "batch"

interface SchemaDefinition {
  name: string
  fields: string[]
  required: string[]
  version: string
}

const schemaDirectory: Record<TransferKind, SchemaDefinition> = {
  token: {
    name: "Token Transfer Schema",
    fields: ["from", "to", "amount", "mint", "memo"],
    required: ["from", "to", "amount", "mint"],
    version: "1.0.1"
  },
  nft: {
    name: "NFT Transfer Schema",
    fields: ["from", "to", "mint", "metadataUri"],
    required: ["from", "to", "mint"],
    version: "1.2.0"
  },
  batch: {
    name: "Batch Transfer Schema",
    fields: ["sender", "recipients", "mint", "distributionMode"],
    required: ["sender", "recipients", "mint"],
    version: "0.9.8"
  }
}

export function getTransferSchema(kind: TransferKind): SchemaDefinition {
  return schemaDirectory[kind]
}

export function listSchemas(): string[] {
  return Object.keys(schemaDirectory)
}
