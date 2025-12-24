import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExtensionContext, TextEditor, WorkspaceFolder } from 'vscode';
import { workspace, window, commands } from 'vscode';
import { activate } from './extension';
import { createDecorationType, refreshDecorations } from './gutter';

vi.mock('./gutter', () => ({
    createDecorationType: vi.fn(() => ({ dispose: vi.fn() })),
    refreshDecorations: vi.fn(),
}));

const createMockContext = () =>
    ({ subscriptions: [], extensionPath: '/mock/extension' }) as unknown as ExtensionContext;

const createMockEditor = (
    filePath: string,
    line: number,
    lineText = 'const x = 1;'
) =>
    ({
        document: {
            uri: { fsPath: filePath },
            lineAt: vi.fn().mockReturnValue({ text: lineText }),
        },
        selection: { active: { line } },
    }) as unknown as TextEditor;

const setWorkspaceFolders = (folders: { name: string; fsPath: string }[] | undefined) => {
    (workspace as { workspaceFolders: readonly WorkspaceFolder[] | undefined }).workspaceFolders =
        folders?.map(f => ({ name: f.name, uri: { fsPath: f.fsPath } })) as unknown as readonly WorkspaceFolder[];
};

describe('extension', () => {
    beforeEach(() => {
        vi.mocked(workspace.createFileSystemWatcher).mockReturnValue({
            onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
            onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
            onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
            dispose: vi.fn(),
        } as never);
    });

    describe('activate', () => {
        it('should register addNote command', () => {
            activate(createMockContext());

            expect(commands.registerCommand).toHaveBeenCalledWith(
                'aiReviewQueue.addNote',
                expect.any(Function)
            );
        });

        it('should add command to subscriptions', () => {
            const mockDisposable = { dispose: vi.fn() };
            vi.mocked(commands.registerCommand).mockReturnValue(mockDisposable);
            const context = createMockContext();

            activate(context);

            expect(context.subscriptions).toContain(mockDisposable);
        });

        it('should create decoration type and add to subscriptions', () => {
            const mockDecorationType = { dispose: vi.fn() };
            vi.mocked(createDecorationType).mockReturnValue(mockDecorationType as never);
            const context = createMockContext();

            activate(context);

            expect(createDecorationType).toHaveBeenCalledWith(context);
            expect(context.subscriptions).toContain(mockDecorationType);
        });

        it('should register editor change listener', () => {
            const context = createMockContext();

            activate(context);

            expect(window.onDidChangeActiveTextEditor).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should create file watcher when workspace folder exists', () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);

            activate(createMockContext());

            expect(workspace.createFileSystemWatcher).toHaveBeenCalledWith(
                expect.stringContaining('my-project/review-notes.md')
            );
        });

        it('should not create file watcher when no workspace folder', () => {
            setWorkspaceFolders(undefined);

            activate(createMockContext());

            expect(workspace.createFileSystemWatcher).not.toHaveBeenCalled();
        });

        it('should call refreshDecorations on activation', () => {
            activate(createMockContext());

            expect(refreshDecorations).toHaveBeenCalled();
        });
    });

    describe('addNote command', () => {
        let addNoteHandler: () => Promise<void>;

        beforeEach(() => {
            vi.mocked(commands.registerCommand).mockImplementation((_, handler) => {
                addNoteHandler = handler;
                return { dispose: vi.fn() };
            });
            activate(createMockContext());
        });

        it('should show error when no active editor', async () => {
            window.activeTextEditor = undefined;

            await addNoteHandler();

            expect(window.showErrorMessage).toHaveBeenCalledWith('No active editor');
        });

        it('should show error when no workspace folder', async () => {
            window.activeTextEditor = createMockEditor('/some/path', 0);
            setWorkspaceFolders(undefined);

            await addNoteHandler();

            expect(window.showErrorMessage).toHaveBeenCalledWith('No workspace folder open');
        });

        it('should prompt user for note input', async () => {
            window.activeTextEditor = createMockEditor('/workspace/src/file.ts', 5);
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            vi.mocked(window.showInputBox).mockResolvedValue(undefined);

            await addNoteHandler();

            expect(window.showInputBox).toHaveBeenCalledWith({
                prompt: 'Add note for src/file.ts:6',
                placeHolder: 'Enter your review note...',
            });
        });

        it('should write note to file when user provides input', async () => {
            window.activeTextEditor = createMockEditor('/workspace/src/file.ts', 5);
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            vi.mocked(window.showInputBox).mockResolvedValue('My review note');
            vi.mocked(workspace.fs.readFile).mockResolvedValue(
                Buffer.from('# AI Review Notes\n\n')
            );

            await addNoteHandler();

            expect(workspace.fs.writeFile).toHaveBeenCalled();
            expect(window.showInformationMessage).toHaveBeenCalledWith(
                'Note added for src/file.ts:6'
            );
        });

        it('should not write when user cancels input', async () => {
            window.activeTextEditor = createMockEditor('/workspace/src/file.ts', 5);
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            vi.mocked(window.showInputBox).mockResolvedValue(undefined);

            await addNoteHandler();

            expect(workspace.fs.writeFile).not.toHaveBeenCalled();
        });
    });
});
