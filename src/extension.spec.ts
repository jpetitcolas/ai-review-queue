import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExtensionContext, TextEditor, WorkspaceFolder } from 'vscode';
import { workspace, window, commands } from 'vscode';
import { activate } from './extension';

const createMockContext = () =>
    ({ subscriptions: [] }) as unknown as ExtensionContext;

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
