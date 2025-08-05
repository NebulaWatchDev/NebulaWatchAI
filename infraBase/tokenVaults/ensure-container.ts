import fs from "fs"
import fsPromises from "fs/promises"
import path from "path"

/**
 * Ensure that a directory exists, creating it (and parents) if needed.
 * @param dirPath  Absolute or relative directory path
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true })
  } catch (err: any) {
    throw new Error(`Failed to create directory "${dirPath}": ${err.message}`)
  }
}

/**
 * Check whether a directory is writable by creating and removing a temp file.
 * @param dirPath  Directory to test
 * @returns        True if writable, false otherwise
 */
export async function isContainerWritable(dirPath: string): Promise<boolean> {
  const testFile = path.join(dirPath, `.__writetest_${Date.now()}`)
  try {
    await fsPromises.writeFile(testFile, "test")
    await fsPromises.unlink(testFile)
    return true
  } catch {
    return false
  }
}

/**
 * Validate that a directory contains all required files.
 * @param dirPath        Directory path
 * @param requiredFiles  Filenames that must exist within dirPath
 * @returns              True if all files are present, false otherwise
 */
export async function validateContainerStructure(
  dirPath: string,
  requiredFiles: string[]
): Promise<boolean> {
  try {
    const entries = await fsPromises.readdir(dirPath)
    const set = new Set(entries)
    return requiredFiles.every((file) => set.has(file))
  } catch {
    return false
  }
}
