import { file } from "bun"

export interface ProcessConfig {
  name: string
  command: string
}

/**
 * Parse a Procfile into an array of process configs
 * Format: name: command
 * Lines starting with # are comments
 * Empty lines are ignored
 */
export function parseProcfile(content: string): ProcessConfig[] {
  const processes: ProcessConfig[] = []

  for (const line of content.split("\n")) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    // Parse name: command format
    const colonIndex = trimmed.indexOf(":")
    if (colonIndex === -1) {
      continue
    }

    const name = trimmed.slice(0, colonIndex).trim()
    const command = trimmed.slice(colonIndex + 1).trim()

    if (name && command) {
      processes.push({ name, command })
    }
  }

  return processes
}

/**
 * Load and parse a Procfile from disk
 */
export async function loadProcfile(path: string): Promise<ProcessConfig[]> {
  const f = file(path)

  if (!(await f.exists())) {
    throw new Error(`Procfile not found: ${path}`)
  }

  const content = await f.text()
  return parseProcfile(content)
}

/**
 * Find a Procfile in the current directory
 */
export async function findProcfile(): Promise<string | null> {
  const candidates = ["Procfile", "procfile", "Procfile.dev"]

  for (const name of candidates) {
    if (await file(name).exists()) {
      return name
    }
  }

  return null
}

