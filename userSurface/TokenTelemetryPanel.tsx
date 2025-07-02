import React from "react"

interface TokenProps {
  symbol: string
  price: number
  liquidity: number
  riskScore: number
  recentVolume?: number
}

export default function TokenTelemetryPanel({
  symbol,
  price,
  liquidity,
  riskScore,
  recentVolume = 0,
}: TokenProps) {
  return (
    <div className="p-4 border rounded-xl space-y-2 bg-background shadow-sm">
      <h3 className="font-medium text-lg">{symbol} Overview</h3>
      <div className="text-sm">Price: <strong>${price.toFixed(2)}</strong></div>
      <div className="text-sm">Liquidity: {liquidity.toLocaleString()}</div>
      <div className="text-sm">24h Volume: {recentVolume.toLocaleString()}</div>
      <div className="text-sm text-yellow-600">Risk Score: {riskScore}/100</div>
      <div className="text-xs text-gray-500">Data updated in real-time</div>
    </div>
  )
}