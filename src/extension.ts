import * as vscode from 'vscode';
import * as path from 'path';
import { getNotesFilePath, formatNoteEntry } from './notes';

async function ensureNotesFileExists(notesPath: string): Promise<void> {
    const uri = vscode.Uri.file(notesPath);
    const dirUri = vscode.Uri.file(path.dirname(notesPath));

    try {
        await vscode.workspace.fs.stat(dirUri);
    } catch {
        await vscode.workspace.fs.createDirectory(dirUri);
    }

    try {
        await vscode.workspace.fs.stat(uri);
    } catch {
        await vscode.workspace.fs.writeFile(uri, Buffer.from('# AI Review Notes\n\n'));
    }
}

async function addNote(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const notesPath = getNotesFilePath(workspaceFolder?.name);
    if (!notesPath) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    const lineNumber = position.line + 1;
    const lineContent = document.lineAt(position.line).text;
    const relativePath = path.relative(workspaceFolder!.uri.fsPath, document.uri.fsPath);

    const note = await vscode.window.showInputBox({
        prompt: `Add note for ${relativePath}:${lineNumber}`,
        placeHolder: 'Enter your review note...'
    });

    if (!note) {
        return;
    }

    await ensureNotesFileExists(notesPath);

    const noteEntry = formatNoteEntry({
        relativePath,
        lineNumber,
        lineContent,
        note,
    });

    const uri = vscode.Uri.file(notesPath);
    const existingContent = await vscode.workspace.fs.readFile(uri);
    const newContent = existingContent.toString() + noteEntry;
    await vscode.workspace.fs.writeFile(uri, Buffer.from(newContent));

    vscode.window.showInformationMessage(`Note added for ${relativePath}:${lineNumber}`);
}

export function activate(context: vscode.ExtensionContext) {
    const addNoteCommand = vscode.commands.registerCommand('aiReviewQueue.addNote', addNote);
    context.subscriptions.push(addNoteCommand);
}

export function deactivate() {}
