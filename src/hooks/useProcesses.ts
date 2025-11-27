import { useCallback, useEffect, useRef, useState } from "react"
import type { Subprocess } from "bun"
import type { LogEntry, Process, ProcessState } from "../utils/types.ts"
import type { ProcessConfig } from "../utils/parse-procfile.ts"
import { parseLogLine } from "../utils/parse-log.ts"
import { registerCleanup } from "../cli.tsx"

/**
 * Kill a process and all its descendants by sending a signal to the process group.
 * On Unix, using a negative PID sends the signal to the entire process group.
 */
function killProcessGroup(pid: number, signal: NodeJS.Signals = "SIGTERM"): void {
  try {
    process.kill(-pid, signal)
  } catch {
    // Process or process group may have already exited
  }
}

interface UseProcessesOptions {
  configs: ProcessConfig[]
}

interface UseProcessesResult {
  processes: Process[]
  killAll: () => void
  kill: (name: string) => void
  restart: (name: string) => void
  clearLogs: (name: string) => void
}

function parseCommand(command: string): { cmd: string; args: string[] } {
  const parts = command.trim().split(/\s+/)
  return {
    cmd: parts[0]!,
    args: parts.slice(1),
  }
}

export function useProcesses({ configs }: UseProcessesOptions): UseProcessesResult {
  const [processes, setProcesses] = useState<Process[]>(() =>
    configs.map((config) => ({
      name: config.name,
      command: config.command,
      state: { running: false },
      logs: [],
    }))
  )

  const subprocessesRef = useRef<Map<string, Subprocess>>(new Map())
  const idCounterRef = useRef(0)
  const configsRef = useRef(configs)

  // Keep configs ref updated
  configsRef.current = configs

  const generateId = useCallback((name: string) => {
    idCounterRef.current += 1
    return `${name}-${idCounterRef.current}`
  }, [])

  const addLog = useCallback(
    (name: string, log: Omit<LogEntry, "id" | "processName">) => {
      setProcesses((prev) =>
        prev.map((p) =>
          p.name === name
            ? {
                ...p,
                logs: [...p.logs, { ...log, id: generateId(name), processName: name }],
              }
            : p
        )
      )
    },
    [generateId]
  )

  const updateState = useCallback((name: string, state: Partial<ProcessState>) => {
    setProcesses((prev) => prev.map((p) => (p.name === name ? { ...p, state: { ...p.state, ...state } } : p)))
  }, [])

  const spawnProcess = useCallback(
    (name: string, command: string) => {
      const { cmd, args } = parseCommand(command)

      try {
        const proc = Bun.spawn([cmd, ...args], {
          env: {
            ...process.env,
            FORCE_COLOR: "1",
            TERM: process.env.TERM || "xterm-256color",
          },
          stdout: "pipe",
          stderr: "pipe",
          stdin: "inherit",
        })

        subprocessesRef.current.set(name, proc)
        updateState(name, { running: true, pid: proc.pid, exitCode: undefined })

        const readStream = async (stream: ReadableStream<Uint8Array> | null, source: "stdout" | "stderr") => {
          if (!stream) return

          const reader = stream.getReader()
          const decoder = new TextDecoder()
          let buffer = ""

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")
              buffer = lines.pop() || ""

              for (const line of lines) {
                if (line.trim()) {
                  const parsed = parseLogLine(line)
                  addLog(name, {
                    timestamp: new Date(),
                    level: parsed.level,
                    message: parsed.message,
                    source,
                    raw: line,
                  })
                }
              }
            }

            if (buffer.trim()) {
              const parsed = parseLogLine(buffer)
              addLog(name, {
                timestamp: new Date(),
                level: parsed.level,
                message: parsed.message,
                source,
                raw: buffer,
              })
            }
          } catch {
            // Stream closed
          }
        }

        readStream(proc.stdout, "stdout")
        readStream(proc.stderr, "stderr")

        proc.exited.then((exitCode) => {
          updateState(name, { running: false, exitCode })
          subprocessesRef.current.delete(name)
        })
      } catch (err) {
        // Command failed to start
        addLog(name, {
          timestamp: new Date(),
          level: "error",
          message: `Failed to start: ${err instanceof Error ? err.message : String(err)}`,
          source: "stderr",
          raw: String(err),
        })
        updateState(name, { running: false, exitCode: 1 })
      }
    },
    [addLog, updateState]
  )

  const kill = useCallback((name: string) => {
    const proc = subprocessesRef.current.get(name)
    if (proc) {
      killProcessGroup(proc.pid)
    }
  }, [])

  const killAll = useCallback(() => {
    for (const proc of subprocessesRef.current.values()) {
      killProcessGroup(proc.pid)
    }
  }, [])

  const restart = useCallback(
    (name: string) => {
      const config = configsRef.current.find((c) => c.name === name)
      if (!config) return

      kill(name)
      setTimeout(() => {
        spawnProcess(name, config.command)
      }, 100)
    },
    [kill, spawnProcess]
  )

  const clearLogs = useCallback((name: string) => {
    setProcesses((prev) => prev.map((p) => (p.name === name ? { ...p, logs: [] } : p)))
  }, [])

  // Start all processes on mount only
  useEffect(() => {
    // Start all processes
    for (const config of configs) {
      spawnProcess(config.name, config.command)
    }

    // Register global cleanup for Ctrl+C
    registerCleanup(() => {
      for (const proc of subprocessesRef.current.values()) {
        killProcessGroup(proc.pid)
      }
    })

    // Cleanup on unmount only
    return () => {
      for (const proc of subprocessesRef.current.values()) {
        killProcessGroup(proc.pid)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - only run on mount

  return { processes, killAll, kill, restart, clearLogs }
}
