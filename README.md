# AI Review Queue

A VSCode extension for collecting review notes on code lines and sending them to Claude in batches.

## Features

- **Add notes to code lines** - Press `Ctrl+Alt+N` on any line to add a review note
- **Queue notes** - Notes are stored in a markdown file for later review
- **Send to Claude** - Press `Ctrl+Alt+C` to send all queued notes to Claude (coming soon)

## Installation

### From Source (Development)

```bash
git clone <repo-url>
cd ai-review-queue
pnpm install
pnpm run compile
```

Then press `F5` in VSCode to launch the Extension Development Host.

### As .vsix Package

```bash
pnpm add -D @vscode/vsce
pnpm run compile
npx vsce package
code --install-extension ai-review-queue-vscode-0.0.1.vsix
```

## Usage

1. Open any project in VSCode
2. Navigate to a line you want to comment on
3. Press `Ctrl+Alt+N` to add a note
4. Enter your review comment in the input box
5. Notes are saved to `~/.claude/{workspace-name}/review-notes.md`

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Add Note | `Ctrl+Alt+N` | Add a note at the current cursor line |
| Send to Claude | `Ctrl+Alt+C` | Send all queued notes to Claude |
| Open Notes | Command Palette | Open the notes markdown file |
| Clear Notes | Command Palette | Clear all notes |

## Development

```bash
pnpm install          # Install dependencies
pnpm run compile      # Build TypeScript
pnpm run watch        # Watch mode
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
```

### Testing the Extension

1. Open this project in VSCode
2. Press `F5` to launch the Extension Development Host
3. A new VSCode window opens with the extension loaded
4. Open any project and try `Ctrl+Alt+N` on a line

## License

MIT
