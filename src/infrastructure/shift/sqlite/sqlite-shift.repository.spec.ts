import { describe, expect, it } from 'vitest'
import { createTempDatabase } from '../../../../test/support/temp-database'
import { SqliteDatabase } from './sqlite-database'
import { SqliteShiftRepository } from './sqlite-shift.repository'

function buildRepository(): { repository: SqliteShiftRepository; database: SqliteDatabase; cleanup: () => void } {
    const { path, cleanup } = createTempDatabase()
    const database = new SqliteDatabase(path)
    const insertShift = database.connection.prepare('INSERT INTO shifts (id, site, starts_at, ends_at, headcount) VALUES (?, ?, ?, ?, ?)')
    const insertRequirement = database.connection.prepare('INSERT INTO shift_requirements (shift_id, code) VALUES (?, ?)')

    insertShift.run('shf_1', 'Warehouse 3, Dorval', '2026-09-15T22:00:00Z', '2026-09-16T06:00:00Z', 2)
    insertRequirement.run('shf_1', 'GUARD_LICENSE')
    insertRequirement.run('shf_1', 'CROWD_CONTROL')
    insertShift.run('shf_2', 'Bell Centre, Montreal', '2026-09-16T23:00:00Z', '2026-09-17T03:00:00Z', 1)

    return { repository: new SqliteShiftRepository(database), database, cleanup }
}

describe('SqliteShiftRepository', () => {
    it('should return a shift with its required qualifications', async () => {
        const { repository, database, cleanup } = buildRepository()

        const shift = await repository.findById('shf_1')

        expect(shift).toEqual({
            id: 'shf_1',
            site: 'Warehouse 3, Dorval',
            start: '2026-09-15T22:00:00Z',
            end: '2026-09-16T06:00:00Z',
            requiredQualifications: ['GUARD_LICENSE', 'CROWD_CONTROL'],
            headcount: 2,
        })

        database.close()
        cleanup()
    })

    it('should return undefined when the shift does not exist', async () => {
        const { repository, database, cleanup } = buildRepository()

        await expect(repository.findById('shf_missing')).resolves.toBeUndefined()

        database.close()
        cleanup()
    })

    it('should return only the requested shifts', async () => {
        const { repository, database, cleanup } = buildRepository()

        const shifts = await repository.findByIds(['shf_2'])

        expect(shifts.map(shift => shift.id)).toEqual(['shf_2'])
        expect(shifts[0]?.requiredQualifications).toEqual([])

        database.close()
        cleanup()
    })

    it('should return an empty list when no shift id is requested', async () => {
        const { repository, database, cleanup } = buildRepository()

        await expect(repository.findByIds([])).resolves.toEqual([])

        database.close()
        cleanup()
    })

    it('should treat an id containing SQL syntax as a plain value', async () => {
        const { repository, database, cleanup } = buildRepository()

        await expect(repository.findById("shf_1' OR '1'='1")).resolves.toBeUndefined()

        database.close()
        cleanup()
    })
})
