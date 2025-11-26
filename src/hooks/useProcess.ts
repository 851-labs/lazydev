import { useState, useEffect, useCallback, useRef } from "react"
import type { Subprocess } from "bun"
import type { LogEntry, ProcessState } from "../utils/types.ts"
import { parseLogLine } from "../utils/parse-log.ts"
import { registerCleanup } from "../cli.tsx"

interface UseProcessOptions {
  command: string
  onLog: (log: LogEntry) => void
}

interface UseProcessResult {
  processState: ProcessState
  kill: () => void
}

/**
 * Parse a command string into executable and args
 */
function parseCommand(command: string): { cmd: string; args: string[] } {
  const parts = command.trim().split(/\s+/)
  return {
    cmd: parts[0]!,
    args: parts.slice(1),
  }
}

export function useProcess({ command, onLog }: UseProcessOptions): UseProcessResult {
  const [processState, setProcessState] = useState<ProcessState>({ running: false })
  const processRef = useRef<Subprocess | null>(null)
  const idCounterRef = useRef(0)
  const onLogRef = useRef(onLog)

  useEffect(() => {
    onLogRef.current = onLog
  }, [onLog])

  const generateId = useCallback(() => {
    idCounterRef.current += 1
    return `log-${idCounterRef.current}`
  }, [])

  const kill = useCallback(() => {
    const proc = processRef.current
    if (proc) {
      proc.kill("SIGTERM")
      processRef.current = null
      setProcessState((prev) => ({ ...prev, running: false }))
    }
  }, [])

  useEffect(() => {
    const { cmd, args } = parseCommand(command)

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

    processRef.current = proc
    setProcessState({ running: true, pid: proc.pid })

    registerCleanup(() => {
      processRef.current?.kill("SIGTERM")
    })

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
              onLogRef.current({
                id: generateId(),
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
          onLogRef.current({
            id: generateId(),
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
      setProcessState({ running: false, pid: proc.pid, exitCode })
      processRef.current = null
    })

    return () => {
      processRef.current?.kill("SIGTERM")
      processRef.current = null
    }
  }, [command, generateId])

  return { processState, kill }
}
