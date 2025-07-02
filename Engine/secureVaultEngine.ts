type VaultAction = "lock" | "unlock" | "relock"

interface VaultState {
  id: string
  active: boolean
  token: string
  balance: number
}

export class SecureVault {
  private states: Map<string, VaultState> = new Map()

  registerVault(id: string, token: string) {
    this.states.set(id, {
      id,
      active: true,
      token,
      balance: 0
    })
  }

  updateBalance(id: string, amount: number): boolean {
    const state = this.states.get(id)
    if (!state || !state.active) return false
    state.balance += amount
    return true
  }

  performAction(id: string, action: VaultAction): string {
    const state = this.states.get(id)
    if (!state) return "Vault not found"
    if (!state.active) return "Vault inactive"

    switch (action) {
      case "lock":
        state.active = false
        return "Vault locked"
      case "unlock":
        state.active = true
        return "Vault unlocked"
      case "relock":
        state.active = false
        return "Vault re-locked"
    }
  }

  getState(id: string): VaultState | undefined {
    return this.states.get(id)
  }
}
