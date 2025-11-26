import { Box, Text } from "ink"
import type { Panel, Process } from "../utils/types.ts"

interface StatusBarProps {
  processes: Process[]
  activePanel: Panel
}

export function StatusBar({ processes, activePanel }: StatusBarProps) {
  const runningCount = processes.filter((p) => p.state.running).length
  const totalLogs = processes.reduce((sum, p) => sum + p.logs.length, 0)

  return (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
      <Box>
        <Text color="gray">
          <Text color="cyan" bold>
            Tab
          </Text>
          {" panel  "}
          <Text color="cyan" bold>
            j/k
          </Text>
          {" navigate  "}
          <Text color="cyan" bold>
            g/G
          </Text>
          {" top/bottom  "}
          <Text color="cyan" bold>
            c
          </Text>
          {" clear  "}
          <Text color="cyan" bold>
            q
          </Text>
          {" quit"}
        </Text>
      </Box>

      <Box>
        <Text color="gray">
          <Text color={runningCount > 0 ? "green" : "red"}>●</Text>
          <Text>
            {" "}
            {runningCount}/{processes.length}
          </Text>
          <Text> │ </Text>
          <Text color="white">{totalLogs}</Text>
          <Text> logs</Text>
          <Text> │ </Text>
          <Text color="cyan">[{activePanel === "processes" ? "1" : "2"}]</Text>
        </Text>
      </Box>
    </Box>
  )
}
