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
};

export const window = {
    activeTextEditor: undefined as
        | {
              document: {
                  uri: { fsPath: string };
                  lineAt: (line: number) => { text: string };
              };
              selection: { active: { line: number } };
          }
        | undefined,
    showInputBox: vi.fn(),
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
};

export const commands = {
    registerCommand: vi.fn(),
};

export interface ExtensionContext {
    subscriptions: { dispose: () => void }[];
}
