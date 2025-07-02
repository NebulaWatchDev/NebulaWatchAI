import React from "react"

interface WhaleSignal {
  address: string
  token: string
  amount: number
  type: "buy" | "sell"
  timestamp?: string
}

export default function NebulaWhaleSignalCard({
  address,
  token,
  amount,
  type,
  timestamp = new Date().toISOString(),
}: WhaleSignal) {
  return (
    <div className="p-3 border rounded-xl bg-white shadow hover:bg-gray-50 transition">
      <h4 className="text-md font-semibold">
        Whale {type === "buy" ? "Buy" : "Sell"} Detected
      </h4>
      <p className="text-sm text-gray-800">Address: {address.slice(0, 6)}...{address.slice(-4)}</p>
      <p className="text-sm text-blue-600">
        {type === "buy" ? "Acquired" : "Sold"} <strong>{amount}</strong> of <strong>{token}</strong>
      </p>
      <p className="text-xs text-gray-400">Time: {new Date(timestamp).toLocaleTimeString()}</p>
    </div>
  )
}