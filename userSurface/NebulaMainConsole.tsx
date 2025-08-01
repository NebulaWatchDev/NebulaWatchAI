import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"

export default function NebulaMainConsole() {
  const [alerts, setAlerts] = useState<string[]>([])
  const [running, setRunning] = useState<boolean>(true)

  const addAlert = useCallback(() => {
    const newAlert = `🚨 Signal at ${new Date().toLocaleTimeString()}`
    setAlerts(prev => [newAlert, ...prev].slice(0, 5))
  }, [])

  useEffect(() => {
    if (!running) return
    const timer = setInterval(addAlert, 8000)
    return () => clearInterval(timer)
  }, [addAlert, running])

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">NebulaWatch Console</h1>
        <Button
          size="sm"
          variant={running ? "destructive" : "secondary"}
          onClick={() => setRunning(r => !r)}
        >
          {running ? "Pause" : "Resume"}
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        Monitor risk signals, token flow, whale behavior, and market anomalies — in one unified view.
      </p>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-sm text-gray-400">No alerts yet</div>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className="text-sm text-blue-600">
              {alert}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
