export function validateApiResponse(response: any): boolean {
  if (!response || typeof response !== "object") return false
  if ("error" in response) return false
  if (!("data" in response || "insight" in response)) return false
  return true
}