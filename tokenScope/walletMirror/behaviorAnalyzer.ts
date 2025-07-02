export class BehaviorAnalyzer {
  private alerts: string[] = []

  constructor(private history: { volume: number; txCount: number }[]) {}

  private averageVolume(): number {
    return this.history.reduce((a, b) => a + b.volume, 0) / this.history.length
  }

  private averageTx(): number {
    return this.history.reduce((a, b) => a + b.txCount, 0) / this.history.length
  }

  detectAnomalies(): void {
    for (let i = 0; i < this.history.length; i++) {
      const { volume, txCount } = this.history[i]
      if (volume > this.averageVolume() * 1.5 || txCount > this.averageTx() * 2) {
        this.alerts.push(`Anomaly at index ${i}: Unusual volume or tx count`)
      }
    }
  }

  getAlerts(): string[] {
    return this.alerts
  }

  logReport(): void {
    this.detectAnomalies()
    this.alerts.forEach(alert => console.log("⚠️", alert))
    if (this.alerts.length === 0) {
      console.log("✅ No anomalies detected")
    }
  }
}