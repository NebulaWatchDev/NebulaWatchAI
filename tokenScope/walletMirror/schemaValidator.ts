export class SchemaValidator {
  validate(wallet: any): boolean {
    const schema = {
      address: 'string',
      balance: 'number',
      createdAt: 'string'
    }

    for (const key in schema) {
      if (!(key in wallet)) {
        console.log(`❌ Missing key: ${key}`)
        return false
      }
      if (typeof wallet[key] !== schema[key]) {
        console.log(`❌ Invalid type for ${key}: expected ${schema[key]}, got ${typeof wallet[key]}`)
        return false
      }
    }

    console.log("✅ Wallet schema is valid")
    return true
  }

  validateBatch(wallets: any[]): void {
    wallets.forEach((wallet, index) => {
      console.log(`Validating wallet #${index + 1}`)
      this.validate(wallet)
    })
  }
}