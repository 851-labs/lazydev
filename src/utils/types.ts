export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  message: string
  source: "stdout" | "stderr"
  raw: string
}

export interface ProcessState {
  running: boolean
  pid?: number
  exitCode?: number | null
}
