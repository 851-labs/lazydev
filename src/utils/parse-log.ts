import type { LogLevel } from "./types.ts"

interface ParsedLog {
  level: LogLevel
  message: string
}

// Patterns to detect log levels
const ERROR_PATTERNS = [
  /\berror\b/i,
  /\bfatal\b/i,
  /\bexception\b/i,
  /\bfailed\b/i,
  /\bERR[!_]/,
  /^\s*Error:/,
  /^\s*TypeError:/,
  /^\s*ReferenceError:/,
  /^\s*SyntaxError:/,
]

const WARN_PATTERNS = [/\bwarn(ing)?\b/i, /\bWARN[!_]/, /\bdeprecated\b/i]

const DEBUG_PATTERNS = [/\bdebug\b/i, /\bDEBUG[_:]/, /\btrace\b/i, /\bverbose\b/i]

/**
 * Detects the log level from a log message
 */
export function detectLogLevel(message: string): LogLevel {
  // Check for error patterns
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return "error"
    }
  }

  // Check for warning patterns
  for (const pattern of WARN_PATTERNS) {
    if (pattern.test(message)) {
      return "warn"
    }
  }

  // Check for debug patterns
  for (const pattern of DEBUG_PATTERNS) {
    if (pattern.test(message)) {
      return "debug"
    }
  }

  return "info"
}

/**
 * Attempts to format JSON in a log message
 */
export function formatJson(message: string): string {
  // Try to find and format JSON objects in the message
  try {
    // Check if the entire message is JSON
    if (message.trim().startsWith("{") || message.trim().startsWith("[")) {
      const parsed = JSON.parse(message.trim())
      return JSON.stringify(parsed, null, 2)
    }
  } catch {
    // Not valid JSON, return as-is
  }

  // Try to find JSON embedded in the message
  const jsonMatch = message.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]!)
      const formatted = JSON.stringify(parsed, null, 2)
      return message.replace(jsonMatch[1]!, formatted)
    } catch {
      // Invalid JSON, return as-is
    }
  }

  return message
}

/**
 * Parses a log line to extract level and clean message
 */
export function parseLogLine(line: string): ParsedLog {
  const level = detectLogLevel(line)
  const message = line

  return { level, message }
}

/**
 * Strips ANSI escape codes from a string
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "")
}

/**
 * Truncates a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
}

/**
 * Formats a timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

/**
 * Formats duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${(ms / 60000).toFixed(1)}m`
}
