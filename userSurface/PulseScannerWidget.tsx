import React, { useEffect, useState } from "react"

export default function PulseScannerWidget() {
  const [sentiment, setSentiment] = useState("Neutral")
  const sentimentStates = ["Neutral", "Bullish", "Bearish", "Volatile", "Unstable"]

  useEffect(() => {
    const timer = setInterval(() => {
      const random = Math.floor(Math.random() * sentimentStates.length)
      setSentiment(sentimentStates[random])
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="border p-3 rounded-xl shadow bg-white">
      <h2 className="font-semibold text-lg">Market Pulse</h2>
      <p className="text-sm text-muted-foreground mt-1">Current sentiment: <span className="font-bold">{sentiment}</span></p>
      <p className="text-xs text-gray-500">Updated every 10s</p>
    </div>
  )
}