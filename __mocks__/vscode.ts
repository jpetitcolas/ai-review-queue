import { vi } from 'vitest';

export const Uri = {
    file: vi.fn((path: string) => ({ fsPath: path, path })),
};

export const workspace = {
    workspaceFolders: undefined as { name: string; uri: { fsPath: string } }[] | undefined,
    fs: {
        stat: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        createDirectory: vi.fn(),
    },
    createFileSystemWatcher: vi.fn(() => ({
        onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
        onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
        onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
        dispose: vi.fn(),
    })),
};

export const window = {
    activeTextEditor: undefined as
        | {
              document: {
                  uri: { fsPath: string };
                  lineAt: (line: number) => { text: string };
                  lineCount: number;
              };
              selection: { active: { line: number } };
              setDecorations: () => void;
          }
        | undefined,
    visibleTextEditors: [] as unknown[],
    showInputBox: vi.fn(),
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    createTextEditorDecorationType: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
};

export const commands = {
    registerCommand: vi.fn(),
};

export interface ExtensionContext {
    subscriptions: { dispose: () => void }[];
    extensionPath: string;
}

export class Range {
    constructor(
        public startLine: number,
        public startChar: number,
        public endLine: number,
        public endChar: number
    ) {}
}
