# dt - Terminal DevTools

Chrome DevTools for your terminal. A lazygit-style TUI that wraps any dev server command and displays Console and Network panels.

![dt terminal devtools](https://via.placeholder.com/800x400?text=dt+Terminal+DevTools)

## Features

- **Console Panel**: Real-time stdout/stderr capture with log level detection (info, warn, error, debug)
- **Network Panel**: Intercepted HTTP requests with method, URL, status, duration, and expandable details
- **Vim-style Navigation**: j/k to scroll, Tab to switch panels, Enter to expand
- **JS Runtime Support**: Automatic fetch/http interception via preload injection
- **Best-effort Support**: Non-JS runtimes work via HTTP_PROXY

## Installation

```bash
bun install
```

## Usage

```bash
# Run any dev server command
bun run src/cli.tsx "bun dev"
bun run src/cli.tsx "npm run dev"
bun run src/cli.tsx "node server.js"

# With custom WebSocket port
bun run src/cli.tsx "bun dev" --port 9230
```

## Keybindings

| Key | Action |
|-----|--------|
| `Tab` / `1` / `2` | Switch between Console and Network panels |
| `j` / `k` / `↑` / `↓` | Scroll through entries |
| `Enter` | Expand network request details |
| `g` / `G` | Go to first / last entry |
| `c` | Clear current panel |
| `q` | Quit |

## How It Works

### Console Capture

The CLI spawns your command as a child process and captures stdout/stderr in real-time. Log levels are detected via pattern matching (error, warn, info, debug).

### Network Capture

**For JS/TS runtimes** (bun, node, npm, yarn, pnpm):
- Injects a preload script via `--preload` (Bun) or `--import` (Node)
- The preload script patches `globalThis.fetch` and `http.request`
- Network events are sent to the CLI via WebSocket

**For other runtimes** (Rust, Go, Python, etc.):
- Sets `HTTP_PROXY` and `HTTPS_PROXY` environment variables
- Works with libraries that respect proxy settings (reqwest, net/http, requests)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  dt CLI (Ink/React TUI)                                 │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │   Console Panel     │  │    Network Panel        │   │
│  │   - stdout/stderr   │  │    - method, url        │   │
│  │   - color-coded     │  │    - status, duration   │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                         │
│  WebSocket Server (port 9229)  ◄── network events       │
└─────────────────────────────────────────────────────────┘
            │
            │ spawns with instrumentation
            ▼
┌─────────────────────────────────────────────────────────┐
│  Child Process (user's dev server)                      │
│  - JS/TS: bun --preload / node --import                 │
│  - Other: HTTP_PROXY env var                            │
└─────────────────────────────────────────────────────────┘
```

## Development

```bash
# Run in development
bun run src/cli.tsx "echo 'hello world'"

# Type check
bun run tsc --noEmit
```

## License

MIT
