import { EventEmitter } from "events"
import pLimit from "p-limit"
import { Connection, PublicKey } from "@solana/web3.js"

export interface InspectionResult {
  wallet: string
  activityCount: number
  tokenCount: number
  error?: string
}

export interface InspectionJobOptions {
  rpcUrl: string
  concurrency?: number         // number of wallets to inspect in parallel
  signatureLimit?: number      // how many signatures to fetch per wallet
  retryAttempts?: number       // retry RPC calls on failure
  activityThreshold?: number   // threshold for high activity warning
}

export class InspectionJob extends EventEmitter {
  private connection: Connection
  private limit: <T>(fn: () => Promise<T>) => Promise<T>
  private stopped = false
  private opts: Required<InspectionJobOptions>

  constructor(
    private wallets: string[],
    options: InspectionJobOptions
  ) {
    super()
    this.opts = {
      concurrency: 5,
      signatureLimit: 100,
      retryAttempts: 1,
      activityThreshold: 70,
      ...options,
    }
    this.connection = new Connection(this.opts.rpcUrl, "confirmed")
    this.limit = pLimit(this.opts.concurrency)
  }

  /** Begins inspecting all wallets; emits `result` and resolves with full array */
  async inspectAll(): Promise<InspectionResult[]> {
    this.stopped = false
    const results: InspectionResult[] = []

    const tasks = this.wallets.map(wallet =>
      this.limit(() => this.inspectWalletWithRetry(wallet))
    )

    for (const task of tasks) {
      if (this.stopped) break
      const res = await task
      results.push(res)
      this.emit("result", res)
      this.logResult(res)
    }

    this.emit("done", results)
    return results
  }

  /** Stops processing further wallets */
  stop(): void {
    this.stopped = true
  }

  private async inspectWalletWithRetry(wallet: string): Promise<InspectionResult> {
    let attempts = 0
    while (attempts <= this.opts.retryAttempts) {
      try {
        return await this.inspectWallet(wallet)
      } catch (err: any) {
        attempts++
        if (attempts > this.opts.retryAttempts) {
          return {
            wallet,
            activityCount: 0,
            tokenCount: 0,
            error: err.message || "Unknown error"
          }
        }
      }
    }
    // Should never reach here
    return { wallet, activityCount: 0, tokenCount: 0, error: "Retry logic failure" }
  }

  private async inspectWallet(wallet: string): Promise<InspectionResult> {
    const pubkey = new PublicKey(wallet)
    const sigs = await this.connection.getSignaturesForAddress(pubkey, {
      limit: this.opts.signatureLimit
    })
    const activityCount = sigs.length

    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubkey, {})
    const tokenCount = tokenAccounts.value.length

    return { wallet, activityCount, tokenCount }
  }

  private logResult(result: InspectionResult): void {
    if (result.error) {
      console.error(`❌ ${result.wallet} → Error: ${result.error}`)
      return
    }
    console.log(`✅ ${result.wallet} → Activity: ${result.activityCount}, Tokens: ${result.tokenCount}`)
    if (result.activityCount > this.opts.activityThreshold) {
      console.warn(`⚠️ High activity detected for ${result.wallet}`)
    }
  }
}

const job = new InspectionJob(["addr1", "addr2"], {
  rpcUrl: "https://api.mainnet-beta.solana.com",
  concurrency: 3,
  signatureLimit: 50,
  retryAttempts: 2,
  activityThreshold: 80,
})

// Listen to individual results
job.on("result", (res: InspectionResult) => {
  // update UI or log externally
})

// Listen for completion
job.on("done", (all: InspectionResult[]) => {
  console.log("All done", all)
})

// Start
job.inspectAll()

// Optionally stop early
setTimeout(() => job.stop(), 10_000)
