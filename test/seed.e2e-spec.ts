import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTempDatabase, type TempDatabase } from './support/temp-database'

const SCRIPT = fileURLToPath(new URL('../scripts/seed.js', import.meta.url))
const FIXTURE = fileURLToPath(new URL('./fixtures/assignments.json', import.meta.url))
const execFileAsync = promisify(execFile)

interface SeedResult {
    code: number
    stdout: string
    stderr: string
}

async function runSeed(source: string, database: string, ...flags: string[]): Promise<SeedResult> {
    try {
        const { stdout, stderr } = await execFileAsync('node', [SCRIPT, '--source', source, '--database', database, ...flags])

        return { code: 0, stdout, stderr }
    } catch (error) {
        const failure = error as { code?: number; stdout?: string; stderr?: string }

        return { code: failure.code ?? 1, stdout: failure.stdout ?? '', stderr: failure.stderr ?? '' }
    }
}

function read(source: (database: DatabaseSync) => unknown, path: string): unknown {
    const database = new DatabaseSync(path, { readOnly: true })

    try {
        return source(database)
    } finally {
        database.close()
    }
}

describe('scripts/seed.js', () => {
    let target: TempDatabase

    beforeEach(() => {
        target = createTempDatabase()
    })

    afterEach(() => {
        target.cleanup()
    })

    it('should populate an empty database from data.json', async () => {
        const result = await runSeed(FIXTURE, target.path)

        expect(result.code).toBe(0)

        const agents = read(database => database.prepare('SELECT COUNT(*) AS count FROM agents').get()?.count, target.path)
        expect(agents).toBe(4)
    })

    it('should insert the agents, their qualifications, the shift requirements and the assignments', async () => {
        await runSeed(FIXTURE, target.path)

        const data = read(database => {
            return {
                agent: database.prepare('SELECT id, name FROM agents WHERE id = ?').get('agt_1'),
                qualifications: database.prepare('SELECT code FROM agent_qualifications WHERE agent_id = ? ORDER BY code').all('agt_1'),
                shift: database.prepare('SELECT site, starts_at, ends_at, headcount FROM shifts WHERE id = ?').get('shf_1'),
                requirements: database.prepare('SELECT code FROM shift_requirements WHERE shift_id = ? ORDER BY code').all('shf_1'),
                assignments: database.prepare('SELECT id, shift_id, agent_id FROM assignments').all(),
            }
        }, target.path)

        expect(data).toEqual({
            agent: { id: 'agt_1', name: 'Jordan Reyes' },
            qualifications: [{ code: 'CROWD_CONTROL' }, { code: 'FIRST_AID' }, { code: 'GUARD_LICENSE' }],
            shift: { site: 'Warehouse 3, Dorval', starts_at: '2026-09-15T22:00:00Z', ends_at: '2026-09-16T06:00:00Z', headcount: 2 },
            requirements: [{ code: 'GUARD_LICENSE' }],
            assignments: [{ id: 'asg_1', shift_id: 'shf_1', agent_id: 'agt_1' }],
        })
    })

    it('should refuse to populate a database that already contains data', async () => {
        await runSeed(FIXTURE, target.path)
        const before = readFileSync(target.path)

        const result = await runSeed(FIXTURE, target.path)

        expect(result.code).toBe(1)
        expect(result.stderr).toContain('already contains data')
        expect(readFileSync(target.path).equals(before)).toBe(true)
    })

    it('should replace the existing data when run with --reset', async () => {
        await runSeed(FIXTURE, target.path)

        const result = await runSeed(FIXTURE, target.path, '--reset')

        expect(result.code).toBe(0)

        const assignments = read(database => database.prepare('SELECT COUNT(*) AS count FROM assignments').get()?.count, target.path)
        expect(assignments).toBe(1)
    })

    it('should fail with a clear message when the source file does not exist', async () => {
        const result = await runSeed(join(target.path, '..', 'missing.json'), target.path)

        expect(result.code).toBe(1)
        expect(result.stderr).toContain('source file not found')
    })
})
