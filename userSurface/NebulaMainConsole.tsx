import React, { useEffect, useState } from "react"

export default function NebulaMainConsole() {
  const [alerts, setAlerts] = useState<string[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      const newAlert = `Signal at ${new Date().toLocaleTimeString()}`
      setAlerts(prev => [newAlert, ...prev.slice(0, 4)])
    }, 8000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">NebulaWatch Console</h1>
      <p className="text-sm text-muted-foreground">
        Monitor risk signals, token flow, whale behavior, and market anomalies — in one unified view.
      </p>
      <div className="space-y-1">
        {alerts.map((alert, i) => (
          <div key={i} className="text-sm text-blue-500">{alert}</div>
        ))}
      </div>
    </div>
  )
}