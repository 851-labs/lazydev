import { Box, Text } from "ink"
import type { ProcessState } from "../utils/types.ts"

interface StatusBarProps {
  processState: ProcessState
  logCount: number
}

export function StatusBar({ processState, logCount }: StatusBarProps) {
  return (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
      <Box>
        <Text color="gray">
          <Text color="cyan" bold>
            j/k
          </Text>
          {" scroll  "}
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
          <Text color={processState.running ? "green" : "red"}>{processState.running ? "●" : "○"}</Text>
          {processState.pid && <Text color="gray"> PID {processState.pid}</Text>}
          {processState.exitCode !== undefined && processState.exitCode !== null && (
            <Text color={processState.exitCode === 0 ? "green" : "red"}> exit {processState.exitCode}</Text>
          )}
          <Text> │ </Text>
          <Text color="white">{logCount}</Text>
          <Text> logs</Text>
        </Text>
      </Box>
    </Box>
  )
}
