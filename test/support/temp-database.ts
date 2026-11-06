import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface TempDatabase {
    /** Path of a SQLite file that does not exist yet. */
    path: string
    cleanup: () => void
}

/** Gives a test its own empty database directory, removed afterwards. */
export function createTempDatabase(): TempDatabase {
    const directory = mkdtempSync(join(tmpdir(), 'shift-database-'))

    return {
        path: join(directory, 'data.sqlite'),
        cleanup: () => rmSync(directory, { recursive: true, force: true }),
    }
}
