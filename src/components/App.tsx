import { Box, useApp, useInput, useStdin, useStdout } from "ink"
import { useCallback, useState } from "react"
import { useProcess } from "../hooks/useProcess.ts"
import type { LogEntry } from "../utils/types.ts"
import { ConsolePanel } from "./ConsolePanel.tsx"
import { StatusBar } from "./StatusBar.tsx"

interface AppProps {
  command: string
}

export function App({ command }: AppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const { isRawModeSupported } = useStdin()

  const terminalWidth = stdout?.columns || 80
  const terminalHeight = stdout?.rows || 24

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedLogIndex, setSelectedLogIndex] = useState(0)

  const handleLog = useCallback((log: LogEntry) => {
    setLogs((prev) => {
      const newLogs = [...prev, log]
      setSelectedLogIndex(newLogs.length - 1)
      return newLogs
    })
  }, [])

  const { processState, kill } = useProcess({
    command,
    onLog: handleLog,
  })

  const clearLogs = useCallback(() => {
    setLogs([])
    setSelectedLogIndex(0)
  }, [])

  useInput(
    (input) => {
      if (input === "q") {
        kill()
        exit()
        return
      }

      if (input === "c") {
        clearLogs()
        return
      }
    },
    { isActive: isRawModeSupported }
  )

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <ConsolePanel
        logs={logs}
        selectedIndex={selectedLogIndex}
        onSelectIndex={setSelectedLogIndex}
        isActive={true}
        height={terminalHeight - 2}
        width={terminalWidth - 2}
        isInteractive={isRawModeSupported}
      />
      <StatusBar processState={processState} logCount={logs.length} />
    </Box>
  )
}
