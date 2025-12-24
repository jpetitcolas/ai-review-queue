import * as vscode from 'vscode';
import * as path from 'path';
import { getNotesFilePath, parseNotesFile, getNotesForFile } from './notes';

let noteDecorationType: vscode.TextEditorDecorationType;

export function createDecorationType(context: vscode.ExtensionContext): vscode.TextEditorDecorationType {
    const iconPath = vscode.Uri.file(
        path.join(context.extensionPath, 'resources', 'note-icon.svg')
    );
    noteDecorationType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: iconPath,
        gutterIconSize: 'contain',
    });
    return noteDecorationType;
}

async function loadNotesContent(notesPath: string): Promise<string> {
    try {
        const uri = vscode.Uri.file(notesPath);
        const content = await vscode.workspace.fs.readFile(uri);
        return content.toString();
    } catch {
        return '';
    }
}

function updateDecorations(editor: vscode.TextEditor, notesContent: string): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return;
    }

    const relativePath = path.relative(workspaceFolder.uri.fsPath, editor.document.uri.fsPath);
    const notes = parseNotesFile(notesContent);
    const fileNotes = getNotesForFile(notes, relativePath);

    const decorations: vscode.DecorationOptions[] = [];
    for (const [lineNumber] of fileNotes) {
        const line = lineNumber - 1;
        if (line >= 0 && line < editor.document.lineCount) {
            decorations.push({
                range: new vscode.Range(line, 0, line, 0),
            });
        }
    }

    editor.setDecorations(noteDecorationType, decorations);
}

export async function refreshDecorations(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const notesPath = getNotesFilePath(workspaceFolder?.name);
    if (!notesPath) {
        return;
    }

    const notesContent = await loadNotesContent(notesPath);

    for (const editor of vscode.window.visibleTextEditors) {
        updateDecorations(editor, notesContent);
    }
}
