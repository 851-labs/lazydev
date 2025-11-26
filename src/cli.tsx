#!/usr/bin/env bun
import { render } from "ink"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { App } from "./components/App.tsx"
import { loadProcfile, findProcfile, type ProcessConfig } from "./utils/parse-procfile.ts"
import pkg from "../package.json"

const argv = yargs(hideBin(process.argv))
  .scriptName("lazydev")
  .usage("$0 [options]", "lazygit-style process manager and log viewer")
  .option("file", {
    alias: "f",
    type: "string",
    describe: "Path to Procfile",
  })
  .option("command", {
    alias: "c",
    type: "string",
    describe: "Single command to run (alternative to Procfile)",
  })
  .example("$0", "Run processes from Procfile in current directory")
  .example("$0 -f Procfile.dev", "Use custom Procfile")
  .example('$0 -c "npm run dev"', "Run a single command")
  .epilogue(
    `Keybindings:
  Tab            Switch panel focus
  j / k          Navigate list / scroll logs
  g / G          Top / bottom
  c              Clear logs
  q              Quit`
  )
  .version(pkg.version)
  .help()
  .parseSync()

async function getProcessConfigs(): Promise<ProcessConfig[]> {
  // Single command mode
  if (argv.command) {
    return [{ name: "main", command: argv.command }]
  }

  // Procfile mode
  const procfilePath = argv.file || (await findProcfile())

  if (!procfilePath) {
    console.error("Error: No Procfile found and no command specified.")
    console.error('Run "lazydev --help" for usage.')
    process.exit(1)
  }

  try {
    return await loadProcfile(procfilePath)
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`)
    process.exit(1)
  }
}

let cleanupFn: (() => void) | null = null

export function registerCleanup(fn: () => void) {
  cleanupFn = fn
}

function handleExit() {
  cleanupFn?.()
  process.exit(0)
}

process.on("SIGINT", handleExit)
process.on("SIGTERM", handleExit)
process.on("SIGHUP", handleExit)

// Main
const processes = await getProcessConfigs()

if (processes.length === 0) {
  console.error("Error: No processes defined in Procfile.")
  process.exit(1)
}

const { waitUntilExit } = render(<App processes={processes} />)

waitUntilExit().then(() => {
  handleExit()
})
