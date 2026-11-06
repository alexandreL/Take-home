import { defineConfig } from 'vitest/config'

export default defineConfig({
    // Resolves the path aliases declared in tsconfig.json.
    resolve: { tsconfigPaths: true },
    test: {
        globals: true,
        root: './',
        include: ['src/**/*.spec.ts'],
        exclude: ['**/*.e2e-spec.ts', '**/node_modules/**', '**/dist/**'],
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/main.ts', 'src/**/*.module.ts', 'src/**/*.spec.ts'],
        },
    },
})
