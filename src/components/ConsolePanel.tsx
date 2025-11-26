import { Box, Text, useInput } from "ink"
import { formatTimestamp, truncate } from "../utils/parse-log.ts"
import type { LogEntry } from "../utils/types.ts"

interface ConsolePanelProps {
  logs: LogEntry[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  isActive: boolean
  height: number
  width: number
  isInteractive?: boolean
}

function getLevelColor(level: LogEntry["level"]): string {
  switch (level) {
    case "error":
      return "red"
    case "warn":
      return "yellow"
    case "debug":
      return "gray"
    default:
      return "white"
  }
}

function getLevelIcon(level: LogEntry["level"]): string {
  switch (level) {
    case "error":
      return "✖"
    case "warn":
      return "⚠"
    case "debug":
      return "○"
    default:
      return "●"
  }
}

function countByLevel(logs: LogEntry[]) {
  return logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

export function ConsolePanel({
  logs,
  selectedIndex,
  onSelectIndex,
  isActive,
  height,
  width,
  isInteractive = true,
}: ConsolePanelProps) {
  useInput(
    (input, key) => {
      if (!isActive) return

      if (input === "j" || key.downArrow) {
        onSelectIndex(Math.min(selectedIndex + 1, logs.length - 1))
      } else if (input === "k" || key.upArrow) {
        onSelectIndex(Math.max(selectedIndex - 1, 0))
      } else if (input === "g") {
        onSelectIndex(0)
      } else if (input === "G") {
        onSelectIndex(logs.length - 1)
      }
    },
    { isActive: isActive && isInteractive }
  )

  const counts = countByLevel(logs)
  const borderColor = isActive ? "cyan" : "gray"

  // Calculate visible range and message width
  const contentHeight = height - 4
  const messageWidth = width - 14 // timestamp (8) + icon (2) + padding (4)
  const halfVisible = Math.floor(contentHeight / 2)
  let startIndex = Math.max(0, selectedIndex - halfVisible)
  const endIndex = Math.min(logs.length, startIndex + contentHeight)

  if (endIndex === logs.length) {
    startIndex = Math.max(0, logs.length - contentHeight)
  }

  const visibleLogs = logs.slice(startIndex, endIndex)

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} height={height}>
      {/* Header */}
      <Box paddingX={1}>
        <Text color={isActive ? "cyan" : "white"} bold>
          [1]
        </Text>
        <Text color={borderColor}>─</Text>
        <Text color={isActive ? "cyan" : "white"} bold>
          All
        </Text>
        <Text color="gray"> ({logs.length})</Text>
        {counts.error ? (
          <>
            <Text color={borderColor}> - </Text>
            <Text color="red">Err ({counts.error})</Text>
          </>
        ) : null}
        {counts.warn ? (
          <>
            <Text color={borderColor}> - </Text>
            <Text color="yellow">Warn ({counts.warn})</Text>
          </>
        ) : null}
      </Box>

      {/* Content */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} overflowY="hidden">
        {logs.length === 0 ? (
          <Text color="gray">Waiting for logs...</Text>
        ) : (
          visibleLogs.map((log, i) => {
            const actualIndex = startIndex + i
            const isSelected = actualIndex === selectedIndex && isActive
            const color = getLevelColor(log.level)
            const icon = getLevelIcon(log.level)

            return (
              <Text key={log.id} wrap="truncate">
                <Text backgroundColor={isSelected ? "blue" : undefined}>
                  <Text color={isSelected ? "white" : "gray"}>{formatTimestamp(log.timestamp)} </Text>
                  <Text color={isSelected ? "white" : color}>{icon} </Text>
                  <Text color={isSelected ? "white" : color}>{truncate(log.message, messageWidth)}</Text>
                </Text>
              </Text>
            )
          })
        )}
      </Box>

      {/* Footer */}
      <Box paddingX={1} justifyContent="flex-end">
        {logs.length > 0 && (
          <Text>
            <Text color="yellow">{selectedIndex + 1}</Text>
            <Text color="gray"> of </Text>
            <Text>{logs.length}</Text>
          </Text>
        )}
      </Box>
    </Box>
  )
}
