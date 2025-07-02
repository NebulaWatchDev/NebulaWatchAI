export type TransferType = "stake" | "unstake" | "mint" | "burn" | "transfer"

interface TransferMetadata {
  label: string
  description: string
  riskScore: number
  systemTag: boolean
}

const transferTypes: Record<TransferType, TransferMetadata> = {
  stake: {
    label: "Stake",
    description: "Locking assets in a staking contract",
    riskScore: 0.2,
    systemTag: true
  },
  unstake: {
    label: "Unstake",
    description: "Releasing staked assets from contract",
    riskScore: 0.3,
    systemTag: true
  },
  mint: {
    label: "Mint",
    description: "Creating new tokens in the supply",
    riskScore: 0.8,
    systemTag: false
  },
  burn: {
    label: "Burn",
    description: "Permanently removing tokens from circulation",
    riskScore: 0.6,
    systemTag: false
  },
  transfer: {
    label: "Transfer",
    description: "Moving tokens between addresses",
    riskScore: 0.4,
    systemTag: false
  }
}

export function getTransferMetadata(type: TransferType): TransferMetadata {
  return transferTypes[type]
}

export function listAllTypes(): TransferType[] {
  return Object.keys(transferTypes) as TransferType[]
}

export function isSystemTag(type: TransferType): boolean {
  return transferTypes[type].systemTag
}
