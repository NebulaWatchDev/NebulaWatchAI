
import { createBlob } from "buffer"
import fs from "fs"

interface TokenData {
  symbol: string
  address: string
  volume: number
}

export function syncToBlob(tokens: TokenData[]): Buffer {
  const raw = JSON.stringify(tokens)
  const blob = createBlob([raw])
  return blob
}

export function saveBlobToDisk(blob: Buffer, path: string): void {
  fs.writeFileSync(path, blob)
}

export function loadSampleTokenData(): TokenData[] {
  return [
    { symbol: "", address: "", volume: 35000 },
    { symbol: "", address: "", volume: 18000 }
  ]
}
