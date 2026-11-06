import { describe, expect, it } from 'vitest'
import { createTempDatabase } from '../../../../test/support/temp-database'
import { SqliteAssignmentRepository } from './sqlite-assignment.repository'
import { SqliteDatabase } from './sqlite-database'

function buildRepository(): { repository: SqliteAssignmentRepository; database: SqliteDatabase; cleanup: () => void } {
    const { path, cleanup } = createTempDatabase()
    const database = new SqliteDatabase(path)
    const insertAgent = database.connection.prepare('INSERT INTO agents (id, name) VALUES (?, ?)')
    const insertShift = database.connection.prepare('INSERT INTO shifts (id, site, starts_at, ends_at, headcount) VALUES (?, ?, ?, ?, ?)')
    const insertAssignment = database.connection.prepare('INSERT INTO assignments (id, shift_id, agent_id) VALUES (?, ?, ?)')

    insertAgent.run('agt_1', 'Jordan Reyes')
    insertAgent.run('agt_2', 'Priya Nadeau')
    insertShift.run('shf_1', 'Warehouse 3, Dorval', '2026-09-15T22:00:00Z', '2026-09-16T06:00:00Z', 2)
    insertShift.run('shf_2', 'Bell Centre, Montreal', '2026-09-16T23:00:00Z', '2026-09-17T03:00:00Z', 1)
    insertAssignment.run('asg_1', 'shf_1', 'agt_1')
    insertAssignment.run('asg_2', 'shf_2', 'agt_2')

    return { repository: new SqliteAssignmentRepository(database), database, cleanup }
}

describe('SqliteAssignmentRepository', () => {
    it('should persist an assignment and return it with its id', async () => {
        const { repository, database, cleanup } = buildRepository()

        const assignment = await repository.create({ shiftId: 'shf_1', agentId: 'agt_2' })

        expect(assignment).toEqual({ id: 'asg_3', shiftId: 'shf_1', agentId: 'agt_2' })
        await expect(repository.findByShiftId('shf_1')).resolves.toContainEqual(assignment)

        database.close()
        cleanup()
    })

    it('should number the first assignment asg_1', async () => {
        const { path, cleanup } = createTempDatabase()
        const database = new SqliteDatabase(path)
        database.connection.prepare('INSERT INTO agents (id, name) VALUES (?, ?)').run('agt_1', 'Jordan Reyes')
        database.connection
            .prepare('INSERT INTO shifts (id, site, starts_at, ends_at, headcount) VALUES (?, ?, ?, ?, ?)')
            .run('shf_1', 'Warehouse 3, Dorval', '2026-09-15T22:00:00Z', '2026-09-16T06:00:00Z', 2)

        const repository = new SqliteAssignmentRepository(database)

        await expect(repository.create({ shiftId: 'shf_1', agentId: 'agt_1' })).resolves.toMatchObject({ id: 'asg_1' })

        database.close()
        cleanup()
    })

    it('should keep the assignments after the database is reopened', async () => {
        const { repository, database, cleanup } = buildRepository()
        const created = await repository.create({ shiftId: 'shf_1', agentId: 'agt_2' })
        database.close()

        const reopened = new SqliteDatabase(database.databasePath)

        await expect(new SqliteAssignmentRepository(reopened).findByShiftId('shf_1')).resolves.toContainEqual(created)

        reopened.close()
        cleanup()
    })

    it('should return the assignments of the requested shifts only', async () => {
        const { repository, database, cleanup } = buildRepository()

        const assignments = await repository.findByShiftId('shf_2')

        expect(assignments).toEqual([{ id: 'asg_2', shiftId: 'shf_2', agentId: 'agt_2' }])

        database.close()
        cleanup()
    })

    it('should return the assignments of the requested agents only', async () => {
        const { repository, database, cleanup } = buildRepository()

        const assignments = await repository.findByAgentIds(['agt_1'])

        expect(assignments).toEqual([{ id: 'asg_1', shiftId: 'shf_1', agentId: 'agt_1' }])

        database.close()
        cleanup()
    })
})
