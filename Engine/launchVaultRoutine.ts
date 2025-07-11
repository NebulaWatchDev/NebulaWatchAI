/**
 * Possible intents for vault operations.
 */
export type VaultIntent = "lock" | "release" | "audit"

/**
 * Request payload for vault operations.
 */
export interface VaultRequest {
  vaultId: string
  operator: string
  intent: VaultIntent
  tokenMint: string
  amount: number
}

/**
 * Standardized response for vault operations.
 */
export interface VaultResponse {
  success: boolean
  intent: VaultIntent
  txId?: string
  error?: string
}

/**
 * Internal payload sent over the wire, enriched with metadata.
 */
interface VaultPayload extends VaultRequest {
  timestamp: number
  nonce: number
}

/**
 * Options for configuring the VaultRoutine.
 */
export interface VaultRoutineOptions {
  /** Number of retry attempts on failure (default: 2) */
  retries?: number
  /** Milliseconds between retry attempts (default: 500) */
  backoffMs?: number
  /** Request timeout in milliseconds (default: 5000) */
  timeoutMs?: number
}

/**
 * VaultRoutine handles calls to a remote vault API endpoint,
 * with automatic payload preparation, retries, and timeout.
 */
export class VaultRoutine {
  private retries: number
  private backoffMs: number
  private timeoutMs: number

  constructor(
    private readonly endpoint: string,
    opts: VaultRoutineOptions = {}
  ) {
    this.retries = opts.retries ?? 2
    this.backoffMs = opts.backoffMs ?? 500
    this.timeoutMs = opts.timeoutMs ?? 5000
  }

  /**
   * Executes a vault action with retry and timeout logic.
   * @param req VaultRequest object
   * @returns VaultResponse with success flag, intent, txId or error
   */
  public async execute(req: VaultRequest): Promise<VaultResponse> {
    this.validateRequest(req)
    const payload = this.preparePayload(req)

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), this.timeoutMs)

        const response = await fetch(`${this.endpoint}/vault/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(id)

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status} ${response.statusText}`
          )
        }

        const json = await response.json()
        return {
          success: true,
          intent: req.intent,
          txId: typeof json.txId === "string" ? json.txId : undefined,
        }
      } catch (err: any) {
        if (attempt < this.retries && this.isRetryable(err)) {
          await this.sleep(this.backoffMs * (attempt + 1))
          continue
        }
        return {
          success: false,
          intent: req.intent,
          error: err.name === "AbortError"
            ? `Request timed out after ${this.timeoutMs}ms`
            : err.message,
        }
      }
    }

    // Fallback case; should not reach
    return {
      success: false,
      intent: req.intent,
      error: "Unexpected failure",
    }
  }

  /** Validate required fields and types in the request */
  private validateRequest(req: VaultRequest): void {
    if (!req.vaultId || !req.operator || !req.tokenMint) {
      throw new TypeError("vaultId, operator, and tokenMint are required")
    }
    if (req.amount <= 0 || isNaN(req.amount)) {
      throw new RangeError("amount must be a positive number")
    }
    if (!["lock", "release", "audit"].includes(req.intent)) {
      throw new TypeError(`Unsupported intent: ${req.intent}`)
    }
  }

  /** Build the payload with timestamp and random nonce */
  private preparePayload(req: VaultRequest): VaultPayload {
    return {
      ...req,
      timestamp: Date.now(),
      nonce: Math.floor(Math.random() * 1e6),
    }
  }

  /** Simple backoff sleep */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /** Determine if an error should trigger a retry */
  private isRetryable(err: any): boolean {
    return (
      err.name === "AbortError" ||
      err.message.startsWith("NetworkError") ||
      /HTTP 5\d{2}/.test(err.message)
    )
  }
}
