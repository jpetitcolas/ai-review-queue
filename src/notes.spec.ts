import { describe, it, expect, vi } from 'vitest';
import * as os from 'os';
import {
    getNotesFilePath,
    formatNoteEntry,
    parseNotesFile,
    getNotesForFile,
    Note,
} from './notes';

vi.mock('os', () => ({
    homedir: vi.fn(),
}));

describe('notes', () => {
    describe('getNotesFilePath', () => {
        it('should return undefined when workspace name is undefined', () => {
            const result = getNotesFilePath(undefined);
            expect(result).toBeUndefined();
        });

        it('should return path in ~/.claude/{workspaceName}/review-notes.md', () => {
            vi.mocked(os.homedir).mockReturnValue('/home/user');

            const result = getNotesFilePath('my-project');

            expect(result).toBe('/home/user/.claude/my-project/review-notes.md');
        });
    });

    describe('formatNoteEntry', () => {
        it('should format note with header, code context, and note body', () => {
            const note: Note = {
                relativePath: 'src/utils.ts',
                lineNumber: 42,
                lineContent: 'const foo = bar;',
                note: 'This should be refactored',
            };

            const result = formatNoteEntry(note);

            expect(result).toBe(
                '## src/utils.ts:42\n> const foo = bar;\n\nThis should be refactored\n\n---\n\n'
            );
        });

        it('should handle empty line content', () => {
            const note: Note = {
                relativePath: 'src/empty.ts',
                lineNumber: 1,
                lineContent: '',
                note: 'Empty line note',
            };

            const result = formatNoteEntry(note);

            expect(result).toBe('## src/empty.ts:1\n> \n\nEmpty line note\n\n---\n\n');
        });
    });

    describe('parseNotesFile', () => {
        it('should return empty array for empty content', () => {
            const result = parseNotesFile('');
            expect(result).toEqual([]);
        });

        it('should return empty array for header-only content', () => {
            const result = parseNotesFile('# AI Review Notes\n\n');
            expect(result).toEqual([]);
        });

        it('should parse single note', () => {
            const content = `# AI Review Notes

## src/utils.ts:42
> const foo = bar;

This should be refactored

---

`;
            const result = parseNotesFile(content);

            expect(result).toEqual([
                {
                    relativePath: 'src/utils.ts',
                    lineNumber: 42,
                    lineContent: 'const foo = bar;',
                    note: 'This should be refactored',
                },
            ]);
        });

        it('should parse multiple notes', () => {
            const content = `# AI Review Notes

## src/utils.ts:42
> const foo = bar;

First note

---

## src/index.ts:10
> import { something } from './somewhere';

Second note

---

`;
            const result = parseNotesFile(content);

            expect(result).toEqual([
                {
                    relativePath: 'src/utils.ts',
                    lineNumber: 42,
                    lineContent: 'const foo = bar;',
                    note: 'First note',
                },
                {
                    relativePath: 'src/index.ts',
                    lineNumber: 10,
                    lineContent: "import { something } from './somewhere';",
                    note: 'Second note',
                },
            ]);
        });

        it('should handle multiline notes', () => {
            const content = `## src/utils.ts:42
> const foo = bar;

This is line one
This is line two
This is line three

---

`;
            const result = parseNotesFile(content);

            expect(result[0].note).toBe('This is line one\nThis is line two\nThis is line three');
        });
    });

    describe('getNotesForFile', () => {
        const notes: Note[] = [
            { relativePath: 'src/utils.ts', lineNumber: 10, lineContent: 'line 10', note: 'note 1' },
            { relativePath: 'src/utils.ts', lineNumber: 20, lineContent: 'line 20', note: 'note 2' },
            { relativePath: 'src/index.ts', lineNumber: 5, lineContent: 'line 5', note: 'note 3' },
        ];

        it('should return empty map when no notes match file', () => {
            const result = getNotesForFile(notes, 'src/other.ts');
            expect(result.size).toBe(0);
        });

        it('should return notes for matching file', () => {
            const result = getNotesForFile(notes, 'src/utils.ts');

            expect(result.get(10)?.note).toBe('note 1');
            expect(result.get(20)?.note).toBe('note 2');
        });

        it('should index notes by line number', () => {
            const result = getNotesForFile(notes, 'src/index.ts');

            expect(result.get(5)?.note).toBe('note 3');
        });
    });
});
