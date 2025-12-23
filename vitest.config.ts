import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        include: ['src/**/*.spec.ts'],
        globals: true,
        mockReset: true,
        alias: {
            vscode: resolve(__dirname, './__mocks__/vscode.ts'),
        },
    },
});
