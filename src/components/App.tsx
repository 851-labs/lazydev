import { Box, useApp, useInput, useStdin, useStdout } from "ink"
import { useCallback, useState } from "react"
import { useProcesses } from "../hooks/useProcesses.ts"
import type { ProcessConfig } from "../utils/parse-procfile.ts"
import type { Panel } from "../utils/types.ts"
import { ConsolePanel } from "./ConsolePanel.tsx"
import { ProcessList } from "./ProcessList.tsx"
import { StatusBar } from "./StatusBar.tsx"

interface AppProps {
  processes: ProcessConfig[]
}

export function App({ processes: processConfigs }: AppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const { isRawModeSupported } = useStdin()

  const terminalWidth = stdout?.columns || 80
  const terminalHeight = stdout?.rows || 24

  // Panel state
  const [activePanel, setActivePanel] = useState<Panel>("processes")
  const [selectedProcessIndex, setSelectedProcessIndex] = useState(0)
  const [selectedLogIndex, setSelectedLogIndex] = useState(0)

  // Process management
  const { processes, killAll, clearLogs } = useProcesses({ configs: processConfigs })

  const selectedProcess = processes[selectedProcessIndex]
  const selectedLogs = selectedProcess?.logs || []

  // Auto-scroll to bottom when new logs come in for selected process
  const handleSelectProcess = useCallback((index: number) => {
    setSelectedProcessIndex(index)
    const proc = processes[index]
    if (proc) {
      setSelectedLogIndex(Math.max(0, proc.logs.length - 1))
    }
  }, [processes])

  // Keep log selection at bottom when new logs arrive
  const currentLogsLength = selectedLogs.length
  if (selectedLogIndex < currentLogsLength - 1 && activePanel === "console") {
    // Don't auto-scroll if user is browsing history
  } else if (currentLogsLength > 0 && selectedLogIndex !== currentLogsLength - 1) {
    setSelectedLogIndex(currentLogsLength - 1)
  }

  useInput(
    (input, key) => {
      if (input === "q") {
        killAll()
        exit()
        return
      }

      if (input === "c" && selectedProcess) {
        clearLogs(selectedProcess.name)
        setSelectedLogIndex(0)
        return
      }

      if (key.tab) {
        setActivePanel((prev) => (prev === "processes" ? "console" : "processes"))
        return
      }

      if (input === "1") {
        setActivePanel("processes")
        return
      }

      if (input === "2") {
        setActivePanel("console")
        return
      }
    },
    { isActive: isRawModeSupported }
  )

  // Layout calculations - process list needs enough width for names + status
  const processListWidth = Math.max(22, Math.min(30, Math.floor(terminalWidth * 0.25)))
  const consoleWidth = terminalWidth - processListWidth

  return (
    <Box flexDirection="column" height={terminalHeight} width={terminalWidth}>
      <Box flexDirection="row" flexGrow={1}>
        <ProcessList
          processes={processes}
          selectedIndex={selectedProcessIndex}
          onSelectIndex={handleSelectProcess}
          isActive={activePanel === "processes"}
          height={terminalHeight - 2}
          width={processListWidth}
          isInteractive={isRawModeSupported}
        />
        <ConsolePanel
          logs={selectedLogs}
          selectedIndex={selectedLogIndex}
          onSelectIndex={setSelectedLogIndex}
          isActive={activePanel === "console"}
          height={terminalHeight - 2}
          width={consoleWidth}
          title={selectedProcess?.name || "Console"}
          isInteractive={isRawModeSupported}
        />
      </Box>

      <StatusBar processes={processes} activePanel={activePanel} />
    </Box>
  )
}
