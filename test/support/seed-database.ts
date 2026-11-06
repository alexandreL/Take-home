import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const SCRIPT = fileURLToPath(new URL('../../scripts/seed.js', import.meta.url))
const execFileAsync = promisify(execFile)

/** Fills a database with the given JSON file, using the seed script itself. */
export async function seedDatabase(source: string, database: string): Promise<void> {
    await execFileAsync('node', [SCRIPT, '--source', source, '--database', database])
}
