import fetch from "node-fetch"

export type VaultIntent = "lock" | "release" | "audit"

export interface VaultRequest {
  vaultId: string
  operator: string
  intent: VaultIntent
  tokenMint: string
  amount: number
}

export interface VaultResponse {
  success: boolean
  intent: VaultIntent
  txId?: string
  error?: string
}

interface VaultPayload extends VaultRequest {
  timestamp: number
  nonce: string
}

export interface VaultRoutineOptions {
  retries?: number
  backoffMs?: number
  timeoutMs?: number
  /** Hooks for instrumentation */
  hooks?: {
    onBeforeRequest?: (payload: VaultPayload) => void
    onAfterResponse?: (response: VaultResponse) => void
    onError?: (error: Error, attempt: number) => void
  }
}

export class VaultRoutine {
  private retries: number
  private backoffMs: number
  private timeoutMs: number
  private hooks: NonNullable<VaultRoutineOptions["hooks"]>

  constructor(
    private readonly endpoint: string,
    opts: VaultRoutineOptions = {}
  ) {
    this.retries = opts.retries ?? 2
    this.backoffMs = opts.backoffMs ?? 500
    this.timeoutMs = opts.timeoutMs ?? 5000
    this.hooks = {
      onBeforeRequest: opts.hooks?.onBeforeRequest ?? (() => {}),
      onAfterResponse: opts.hooks?.onAfterResponse ?? (() => {}),
      onError: opts.hooks?.onError ?? (() => {}),
    }
  }

  public async execute(req: VaultRequest): Promise<VaultResponse> {
    this.validateRequest(req)
    const payload = this.preparePayload(req)

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        this.log("info", `Attempt ${attempt + 1} for intent ${req.intent}`, payload)
        this.hooks.onBeforeRequest(payload)

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.timeoutMs)

        const res = await fetch(`${this.endpoint}/vault/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`)
        }

        const json = await res.json().catch(() => ({}))
        const response: VaultResponse = {
          success: true,
          intent: req.intent,
          txId: typeof json.txId === "string" ? json.txId : undefined,
        }

        this.log("info", "Request succeeded", response)
        this.hooks.onAfterResponse(response)
        return response
      } catch (err: any) {
        this.hooks.onError(err, attempt + 1)
        const retryable = this.isRetryable(err)
        this.log("warn", `Error on attempt ${attempt + 1}: ${err.message}`, {
          retryable,
        })
        if (attempt < this.retries && retryable) {
          await this.sleep(this.backoffMs * (attempt + 1))
          continue
        }
        const errorMsg =
          err.name === "AbortError"
            ? `Timeout after ${this.timeoutMs}ms`
            : err.message
        const failure: VaultResponse = {
          success: false,
          intent: req.intent,
          error: errorMsg,
        }
        this.log("error", "Request failed", failure)
        this.hooks.onAfterResponse(failure)
        return failure
      }
    }

    // Should not reach here
    const fallback: VaultResponse = {
      success: false,
      intent: req.intent,
      error: "Unexpected failure",
    }
    this.log("error", "Fallback response", fallback)
    this.hooks.onAfterResponse(fallback)
    return fallback
  }

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

  private preparePayload(req: VaultRequest): VaultPayload {
    return {
      ...req,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    }
  }

  private isRetryable(err: Error): boolean {
    return (
      err.name === "AbortError" ||
      /NetworkError|ECONNRESET|ECONNREFUSED/.test(err.message) ||
      /HTTP 5\d{2}/.test(err.message)
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private log(level: "info" | "warn" | "error", msg: string, meta: any = {}): void {
    const entry = { timestamp: new Date().toISOString(), level, msg, ...meta }
    console[level](`[VaultRoutine]`, entry)
  }
}
