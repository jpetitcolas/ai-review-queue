import * as path from 'path';
import * as os from 'os';

export interface Note {
    relativePath: string;
    lineNumber: number;
    lineContent: string;
    note: string;
}

export function getNotesFilePath(workspaceName: string | undefined): string | undefined {
    if (!workspaceName) {
        return undefined;
    }
    return path.join(os.homedir(), '.claude', workspaceName, 'review-notes.md');
}

export function formatNoteEntry(note: Note): string {
    return `## ${note.relativePath}:${note.lineNumber}\n> ${note.lineContent}\n\n${note.note}\n\n---\n\n`;
}

export function parseNotesFile(content: string): Note[] {
    const notes: Note[] = [];
    const noteBlocks = content.split('---').filter(block => block.trim());

    for (const block of noteBlocks) {
        const headerMatch = block.match(/^##\s+(.+):(\d+)/m);
        const codeMatch = block.match(/^>\s*(.*)$/m);

        if (headerMatch) {
            const relativePath = headerMatch[1];
            const lineNumber = parseInt(headerMatch[2], 10);
            const lineContent = codeMatch ? codeMatch[1] : '';

            const lines = block.split('\n');
            const noteStartIndex = lines.findIndex(line => line.startsWith('>')) + 1;
            const noteLines = lines.slice(noteStartIndex).filter(line => !line.startsWith('#') && line.trim());
            const noteText = noteLines.join('\n').trim();

            if (noteText) {
                notes.push({
                    relativePath,
                    lineNumber,
                    lineContent,
                    note: noteText,
                });
            }
        }
    }

    return notes;
}

export function getNotesForFile(notes: Note[], relativePath: string): Map<number, Note> {
    const fileNotes = new Map<number, Note>();
    for (const note of notes) {
        if (note.relativePath === relativePath) {
            fileNotes.set(note.lineNumber, note);
        }
    }
    return fileNotes;
}
