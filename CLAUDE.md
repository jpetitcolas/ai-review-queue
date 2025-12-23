# AI Review Queue - VSCode Extension

A VSCode extension for adding review notes to code lines, queuing them, and sending batched reviews to Claude.

## Prerequisites

- **Claude Code VSCode extension** - This extension integrates with Claude Code by sending notes to its terminal. Install from the VSCode marketplace.

## Project Structure

```
ai-review-queue/
├── package.json          # Extension manifest with commands, keybindings, activation events
├── tsconfig.json         # TypeScript config (ES2022, strict mode)
├── vitest.config.ts      # Vitest test configuration
├── __mocks__/
│   └── vscode.ts         # VSCode API mock for unit testing
├── src/
│   ├── extension.ts      # Main extension entry point (VSCode-dependent code)
│   ├── extension.spec.ts # Unit tests for extension.ts
│   ├── notes.ts          # Pure functions for note manipulation (testable)
│   └── notes.spec.ts     # Unit tests for notes.ts
├── .vscodeignore         # Files to exclude from extension package
└── CLAUDE.md
```

## Commands & Keybindings

| Command ID                   | Keybinding   | Description                        |
|------------------------------|--------------|------------------------------------|
| `aiReviewQueue.addNote`      | `Ctrl+Alt+N` | Add note at current cursor line    |
| `aiReviewQueue.openNotes`    | None         | Open the notes markdown file       |
| `aiReviewQueue.sendToClaude` | `Ctrl+Alt+C` | Send all queued notes to Claude    |
| `aiReviewQueue.clearNotes`   | None         | Clear all notes and decorations    |

## Storage Format

Notes are stored at `~/.claude/{workspaceFolderName}/review-notes.md`

Each note follows this format:

```markdown
## file/path.ts:42
> const foo = bar;

User's note here

---
```

- Header: `## {relativePath}:{lineNumber}`
- Code context: `> {lineContent}` (the actual code at that line)
- Note body: User's free-form text
- Separator: `---` between notes

## Technical Implementation

### Gutter Decorations

- Use `vscode.window.createTextEditorDecorationType()` with `gutterIconPath`
- Parse notes file on extension activation and when files open
- Track decorated lines per file in a `Map<string, number[]>`
- Refresh decorations when notes file changes (use `FileSystemWatcher`)

### Claude Terminal Integration

- Find existing terminal: `vscode.window.terminals.find(t => t.name.toLowerCase().includes('claude'))`
- If no Claude terminal found, create one: `vscode.window.createTerminal({ name: 'Claude' })` and run `claude`
- Send content via `terminal.sendText(content)`
- Show terminal after sending: `terminal.show()`

### File Operations

- Use `vscode.workspace.fs` for file read/write
- Create directories recursively if they don't exist
- Use `os.homedir()` to resolve `~/.claude/` path

## Build & Development

```bash
pnpm install          # Install dependencies
pnpm run compile      # Build TypeScript
pnpm run watch        # Watch mode for development
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
```

To test the extension: Press F5 in VSCode to launch Extension Development Host.

## Dependencies

- `@types/vscode`: VSCode API types
- `@types/node`: Node.js types
- `typescript`: TypeScript compiler
- `vitest`: Unit testing framework
- `@vscode/vsce`: Extension packaging tool (optional, for publishing)

## VSCode Extension APIs Used

- `vscode.commands.registerCommand()` - Register commands
- `vscode.window.showInputBox()` - Get user input for notes
- `vscode.window.createTextEditorDecorationType()` - Gutter icons
- `vscode.window.activeTextEditor` - Current editor/cursor position
- `vscode.workspace.fs` - File system operations
- `vscode.window.terminals` - Terminal access
- `vscode.workspace.workspaceFolders` - Get project name
- `vscode.workspace.createFileSystemWatcher()` - Watch notes file changes
