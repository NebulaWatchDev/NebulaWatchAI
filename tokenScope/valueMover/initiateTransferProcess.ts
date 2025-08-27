// TransferEngine.ts
import { validateTransfer, TransferPayload } from "./transferSchemaBuilder"

export interface TransferResult {
  success: boolean
  txId?: string
  error?: string
  status?: number
  attempts: number
  raw?: unknown
}

export interface TransferEngineOptions {
  /** Default request timeout (ms). Default 10_000 */
  timeoutMs?: number
  /** Retry attempts on network/5xx/429. Default 2 */
  retryAttempts?: number
  /** Linear backoff base (attempt N waits N * retryDelayMs). Default 400 */
  retryDelayMs?: number
  /** Default headers merged into every request */
  defaultHeaders?: Record<string, string>
}

export interface InitiateOptions {
  /** Per-call timeout override */
  timeoutMs?: number
  /** Per-call idempotency key header */
  idempotencyKey?: string
  /** Extra headers merged over engine defaults */
  headers?: Record<string, string>
  /** Abort the request using this signal */
  signal?: AbortSignal
}

export class TransferEngine {
  private readonly endpoint: string
  private readonly timeoutMs: number
  private readonly retryAttempts: number
  private readonly retryDelayMs: number
  private readonly defaultHeaders: Record<string, string>

  constructor(endpoint: string, opts: TransferEngineOptions = {}) {
    if (!endpoint) throw new Error("endpoint is required")
    try { new URL(endpoint) } catch { throw new Error(`Invalid endpoint URL: ${endpoint}`) }

    this.endpoint = endpoint.replace(/\/+$/, "")
    this.timeoutMs = opts.timeoutMs ?? 10_000
    this.retryAttempts = Math.max(0, opts.retryAttempts ?? 2)
    this.retryDelayMs = Math.max(0, opts.retryDelayMs ?? 400)
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...(opts.defaultHeaders ?? {}),
    }
  }

  /**
   * Validate, send, and return a structured result.
   */
  async initiate(payload: unknown, options: InitiateOptions = {}): Promise<TransferResult> {
    let attempts = 0
    let lastErr: string | undefined
    let lastStatus: number | undefined
    let lastRaw: unknown

    try {
      const data: TransferPayload = validateTransfer(payload)

      const doOnce = async () => {
        attempts++
        const res = await this.sendTransferRequest(data, options)
        lastStatus = res.status
        lastRaw = res.body
        if (res.ok && typeof res.body === "object" && res.body && "txId" in res.body) {
          return String((res.body as any).txId)
        }
        const msg = inferErrorMessage(res.body) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }

      for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
        try {
          const txId = await doOnce()
          return { success: true, txId, attempts, status: lastStatus, raw: lastRaw }
        } catch (e: any) {
          lastErr = e?.message ?? String(e)
          // retry on network error, 429, or 5xx
          const retryable = lastStatus === undefined || lastStatus === 429 || (lastStatus ?? 0) >= 500
          if (attempt < this.retryAttempts && retryable) {
            await sleep(this.retryDelayMs * (attempt + 1))
            continue
          }
          break
        }
      }
    } catch (e: any) {
      lastErr = e?.message ?? String(e)
    }

    return { success: false, error: lastErr, status: lastStatus, attempts, raw: lastRaw }
  }

  /** Low-level HTTP with timeout + safe JSON parsing */
  private async sendTransferRequest(
    data: TransferPayload,
    options: InitiateOptions
  ): Promise<{ ok: boolean; status: number; body: unknown }> {
    const controller = new AbortController()
    const timers: NodeJS.Timeout[] = []
    const clearAll = () => timers.forEach(clearTimeout)

    // Link external abort signal
    const onAbort = () => controller.abort()
    if (options.signal) {
      if (options.signal.aborted) controller.abort()
      else options.signal.addEventListener("abort", onAbort, { once: true })
    }

    // Timeout
    const timeout = options.timeoutMs ?? this.timeoutMs
    timers.push(setTimeout(() => controller.abort(), timeout))

    try {
      const headers = {
        ...this.defaultHeaders,
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
        ...(options.headers ?? {}),
      }

      const resp = await fetch(`${this.endpoint}/transfer`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      } as RequestInit)

      const text = await resp.text().catch(() => "")
      const body = parseJsonSafe(text)
      return { ok: resp.ok, status: resp.status, body }
    } catch (e: any) {
      // Treat aborts/timeouts as status undefined; caller decides retry
      return { ok: false, status: (e?.status as number) ?? undefined as any, body: e?.message ?? "Request failed" }
    } finally {
      clearAll()
      if (options.signal) options.signal.removeEventListener("abort", onAbort)
    }
  }
}

/* ---------------- helpers ---------------- */

function parseJsonSafe(s: string): unknown {
  if (!s) return undefined
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

function inferErrorMessage(body: unknown): string | undefined {
  if (!body) return undefined
  if (typeof body === "string") return body.slice(0, 500)
  if (typeof body === "object") {
    const obj = body as Record<string, any>
    return (
      obj.error ??
      obj.message ??
      (typeof obj.details === "string" ? obj.details : undefined)
    )
  }
  return undefined
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
