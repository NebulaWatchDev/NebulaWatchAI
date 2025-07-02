

import fs from "fs"
import path from "path"

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export function isContainerWritable(dirPath: string): boolean {
  const testFile = path.join(dirPath, "__test.tmp")
  try {
    fs.writeFileSync(testFile, "test")
    fs.unlinkSync(testFile)
    return true
  } catch {
    return false
  }
}

export function validateContainerStructure(dirPath: string, requiredFiles: string[]): boolean {
  return requiredFiles.every((file) => fs.existsSync(path.join(dirPath, file)))
}
