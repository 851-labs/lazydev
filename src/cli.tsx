#!/usr/bin/env bun
import { render } from "ink"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { App } from "./components/App.tsx"
import pkg from "../package.json"

const argv = yargs(hideBin(process.argv))
  .scriptName("lazydev")
  .usage("$0 <command>", "Terminal DevTools - wrap any command in a lazygit-style log viewer", (yargs) =>
    yargs.positional("command", {
      describe: "Command to run (e.g., 'npm run dev')",
      type: "string",
      demandOption: true,
    })
  )
  .example('$0 "npm run dev"', "Run npm dev server")
  .example('$0 "bun dev"', "Run bun dev server")
  .example('$0 "cargo run"', "Run any command")
  .epilogue(
    `Keybindings:
  j / k / ↑ / ↓  Scroll
  g / G          Top / bottom
  c              Clear logs
  q              Quit`
  )
  .version(pkg.version)
  .help()
  .strict()
  .parseSync()

const command = argv.command as string

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

const { waitUntilExit } = render(<App command={command} />)

waitUntilExit().then(() => {
  handleExit()
})
