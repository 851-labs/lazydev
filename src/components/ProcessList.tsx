import { Box, Text, useInput } from "ink"
import type { Process } from "../utils/types.ts"
import { truncate } from "../utils/parse-log.ts"

interface ProcessListProps {
  processes: Process[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  isActive: boolean
  height: number
  width: number
  isInteractive?: boolean
}

function getStatusIcon(process: Process): string {
  if (process.state.running) return "●"
  if (process.state.exitCode === 0) return "○"
  if (process.state.exitCode !== undefined) return "✖"
  return "○"
}

function getStatusColor(process: Process): string {
  if (process.state.running) return "green"
  if (process.state.exitCode === 0) return "gray"
  if (process.state.exitCode !== undefined) return "red"
  return "gray"
}

export function ProcessList({
  processes,
  selectedIndex,
  onSelectIndex,
  isActive,
  height,
  width,
  isInteractive = true,
}: ProcessListProps) {
  useInput(
    (input, key) => {
      if (!isActive) return

      if (input === "j" || key.downArrow) {
        onSelectIndex(Math.min(selectedIndex + 1, processes.length - 1))
      } else if (input === "k" || key.upArrow) {
        onSelectIndex(Math.max(selectedIndex - 1, 0))
      } else if (input === "g") {
        onSelectIndex(0)
      } else if (input === "G") {
        onSelectIndex(processes.length - 1)
      }
    },
    { isActive: isActive && isInteractive }
  )

  const borderColor = isActive ? "cyan" : "gray"
  const runningCount = processes.filter((p) => p.state.running).length
  // Width available for process name: total - border (2) - padding (2) - icon (2) - arrow (2)
  const nameWidth = width - 8

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} height={height} width={width}>
      {/* Header */}
      <Box paddingX={1}>
        <Text color={isActive ? "cyan" : "white"} bold>
          [1]
        </Text>
        <Text color={borderColor}>─</Text>
        <Text color={isActive ? "cyan" : "white"} bold>
          Procs
        </Text>
        <Text color="gray">
          {" "}
          ({runningCount}/{processes.length})
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} overflowY="hidden">
        {processes.map((process, i) => {
          const isSelected = i === selectedIndex
          const icon = getStatusIcon(process)
          const color = getStatusColor(process)
          const name = truncate(process.name, nameWidth)

          return (
            <Text key={process.name} wrap="truncate">
              <Text backgroundColor={isSelected && isActive ? "blue" : undefined}>
                <Text color={isSelected && isActive ? "white" : color}>{icon} </Text>
                <Text color={isSelected && isActive ? "white" : "white"}>{name}</Text>
                {isSelected && <Text color={isActive ? "white" : "gray"}> ▶</Text>}
              </Text>
            </Text>
          )
        })}
      </Box>

      {/* Footer */}
      <Box paddingX={1} justifyContent="flex-end">
        <Text color="gray">
          <Text color="yellow">{selectedIndex + 1}</Text>
          <Text> of {processes.length}</Text>
        </Text>
      </Box>
    </Box>
  )
}
