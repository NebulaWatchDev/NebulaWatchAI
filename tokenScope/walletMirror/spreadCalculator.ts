export class SpreadCalculator {
  constructor(private buyPrices: number[], private sellPrices: number[]) {}

  calculateAverageBuy(): number {
    return this.buyPrices.reduce((a, b) => a + b, 0) / this.buyPrices.length
  }

  calculateAverageSell(): number {
    return this.sellPrices.reduce((a, b) => a + b, 0) / this.sellPrices.length
  }

  calculateSpread(): number {
    const avgBuy = this.calculateAverageBuy()
    const avgSell = this.calculateAverageSell()
    return +(avgSell - avgBuy).toFixed(4)
  }

  logSummary(): void {
    console.log("Average Buy Price:", this.calculateAverageBuy())
    console.log("Average Sell Price:", this.calculateAverageSell())
    console.log("Spread:", this.calculateSpread())
  }

  analyze(): void {
    this.logSummary()
    if (this.calculateSpread() > 0.5) {
      console.log("⚠️ High spread detected")
    } else {
      console.log("✅ Spread within normal range")
    }
  }

  simulateUpdate(newBuy: number[], newSell: number[]) {
    this.buyPrices = newBuy
    this.sellPrices = newSell
    this.analyze()
  }
}