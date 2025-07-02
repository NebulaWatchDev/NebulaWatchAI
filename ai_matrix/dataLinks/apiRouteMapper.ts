export function mapToEndpoint(resource: string): string {
  const baseURL = "https://api.dexscreener.com/latest"

  switch (resource) {
    case "token-insight":
      return `${baseURL}/insight/token`
    case "wallet-profile":
      return `${baseURL}/insight/wallet`
    case "protocol-risk":
      return `${baseURL}/risk/protocol`
    case "dexscreener":
      return `${baseURL}/market/dexscreener`
    case "streamflow":
      return `${baseURL}/tracking/streamflow`
    case "rugcheck":
      return `${baseURL}/audit/rugcheck`
    case "solana-tracker":
      return `${baseURL}/tracker/solana`
    default:
      throw new Error(`Unknown resource: ${resource}`)
  }
}
