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

// ANSI escape code regex - matches all ANSI sequences
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?\x07|\x1b[PX^_].*?\x1b\\|\x1b.|\x07/g

/**
 * Strips ANSI escape codes from a string
 */
export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, "")
}

/**
 * Detects the log level from a log message
 */
export function detectLogLevel(message: string): LogLevel {
  const clean = stripAnsi(message)

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(clean)) {
      return "error"
    }
  }

  for (const pattern of WARN_PATTERNS) {
    if (pattern.test(clean)) {
      return "warn"
    }
  }

  for (const pattern of DEBUG_PATTERNS) {
    if (pattern.test(clean)) {
      return "debug"
    }
  }

  return "info"
}

/**
 * Parses a log line to extract level and clean message
 */
export function parseLogLine(line: string): ParsedLog {
  // Strip ANSI codes for cleaner display
  const clean = stripAnsi(line).trim()
  const level = detectLogLevel(clean)

  return { level, message: clean }
}

/**
 * Truncates a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (maxLength <= 3) return str.slice(0, maxLength)
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
