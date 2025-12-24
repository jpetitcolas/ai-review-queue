import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExtensionContext, TextEditor, WorkspaceFolder } from 'vscode';
import { workspace, window, Uri, Range } from 'vscode';
import { createDecorationType, refreshDecorations } from './gutter';

const createMockContext = () =>
    ({ subscriptions: [], extensionPath: '/mock/extension' }) as unknown as ExtensionContext;

const createMockEditor = (fsPath: string, lineCount = 100) =>
    ({
        document: {
            uri: { fsPath },
            lineCount,
        },
        setDecorations: vi.fn(),
    }) as unknown as TextEditor;

const setWorkspaceFolders = (folders: { name: string; fsPath: string }[] | undefined) => {
    (workspace as { workspaceFolders: readonly WorkspaceFolder[] | undefined }).workspaceFolders =
        folders?.map(f => ({ name: f.name, uri: { fsPath: f.fsPath } })) as unknown as readonly WorkspaceFolder[];
};

const setVisibleEditors = (editors: TextEditor[]) => {
    (window as unknown as { visibleTextEditors: TextEditor[] }).visibleTextEditors = editors;
};

describe('gutter', () => {
    const mockDecorationType = { dispose: vi.fn() };

    beforeEach(() => {
        setWorkspaceFolders(undefined);
        setVisibleEditors([]);
        vi.mocked(Uri.file).mockImplementation((path: string) => ({ fsPath: path, path }) as never);
        vi.mocked(window.createTextEditorDecorationType).mockReturnValue(mockDecorationType as never);
    });

    describe('createDecorationType', () => {
        it('creates decoration type with gutter icon path', () => {
            createDecorationType(createMockContext());

            expect(window.createTextEditorDecorationType).toHaveBeenCalledWith({
                gutterIconPath: { fsPath: '/mock/extension/resources/note-icon.svg', path: '/mock/extension/resources/note-icon.svg' },
                gutterIconSize: 'contain',
            });
        });

        it('returns the created decoration type', () => {
            const result = createDecorationType(createMockContext());

            expect(result).toBe(mockDecorationType);
        });
    });

    describe('refreshDecorations', () => {
        beforeEach(() => {
            createDecorationType(createMockContext());
        });

        it('does nothing when no workspace folder', async () => {
            setWorkspaceFolders(undefined);

            await refreshDecorations();

            expect(workspace.fs.readFile).not.toHaveBeenCalled();
        });

        it('reads notes file from workspace-specific path', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('File not found'));

            await refreshDecorations();

            expect(Uri.file).toHaveBeenCalledWith(expect.stringContaining('my-project/review-notes.md'));
        });

        it('applies decorations to lines with notes', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            const mockEditor = createMockEditor('/workspace/src/file.ts');
            setVisibleEditors([mockEditor]);
            vi.mocked(workspace.fs.readFile).mockResolvedValue(
                Buffer.from('## src/file.ts:10\n> const x = 1;\n\nMy note\n\n---\n\n')
            );

            await refreshDecorations();

            expect(mockEditor.setDecorations).toHaveBeenCalledWith(
                mockDecorationType,
                [{ range: expect.any(Range) }]
            );
        });

        it('applies decorations for multiple notes in same file', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            const mockEditor = createMockEditor('/workspace/src/file.ts');
            setVisibleEditors([mockEditor]);
            vi.mocked(workspace.fs.readFile).mockResolvedValue(
                Buffer.from(
                    '## src/file.ts:10\n> line 10\n\nNote 1\n\n---\n\n' +
                    '## src/file.ts:20\n> line 20\n\nNote 2\n\n---\n\n'
                )
            );

            await refreshDecorations();

            expect(mockEditor.setDecorations).toHaveBeenCalledWith(
                mockDecorationType,
                [{ range: expect.any(Range) }, { range: expect.any(Range) }]
            );
        });

        it('ignores notes for other files', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            const mockEditor = createMockEditor('/workspace/src/file.ts');
            setVisibleEditors([mockEditor]);
            vi.mocked(workspace.fs.readFile).mockResolvedValue(
                Buffer.from('## src/other.ts:10\n> const x = 1;\n\nNote for other file\n\n---\n\n')
            );

            await refreshDecorations();

            expect(mockEditor.setDecorations).toHaveBeenCalledWith(mockDecorationType, []);
        });

        it('skips lines outside document range', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            const mockEditor = createMockEditor('/workspace/src/file.ts', 5);
            setVisibleEditors([mockEditor]);
            vi.mocked(workspace.fs.readFile).mockResolvedValue(
                Buffer.from('## src/file.ts:100\n> line 100\n\nNote beyond file\n\n---\n\n')
            );

            await refreshDecorations();

            expect(mockEditor.setDecorations).toHaveBeenCalledWith(mockDecorationType, []);
        });

        it('handles empty notes file gracefully', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            const mockEditor = createMockEditor('/workspace/src/file.ts');
            setVisibleEditors([mockEditor]);
            vi.mocked(workspace.fs.readFile).mockResolvedValue(Buffer.from(''));

            await refreshDecorations();

            expect(mockEditor.setDecorations).toHaveBeenCalledWith(mockDecorationType, []);
        });

        it('handles missing notes file gracefully', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            const mockEditor = createMockEditor('/workspace/src/file.ts');
            setVisibleEditors([mockEditor]);
            vi.mocked(workspace.fs.readFile).mockRejectedValue(new Error('File not found'));

            await refreshDecorations();

            expect(mockEditor.setDecorations).toHaveBeenCalledWith(mockDecorationType, []);
        });

        it('updates all visible editors', async () => {
            setWorkspaceFolders([{ name: 'my-project', fsPath: '/workspace' }]);
            const editor1 = createMockEditor('/workspace/src/file1.ts');
            const editor2 = createMockEditor('/workspace/src/file2.ts');
            setVisibleEditors([editor1, editor2]);
            vi.mocked(workspace.fs.readFile).mockResolvedValue(Buffer.from(''));

            await refreshDecorations();

            expect(editor1.setDecorations).toHaveBeenCalled();
            expect(editor2.setDecorations).toHaveBeenCalled();
        });
    });
});
