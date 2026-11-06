import { describe, expect, it } from 'vitest'
import { createTempDatabase } from '../../../../test/support/temp-database'
import { SqliteAgentRepository } from './sqlite-agent.repository'
import { SqliteDatabase } from './sqlite-database'

function buildRepository(): { repository: SqliteAgentRepository; database: SqliteDatabase; cleanup: () => void } {
    const { path, cleanup } = createTempDatabase()
    const database = new SqliteDatabase(path)
    const insertAgent = database.connection.prepare('INSERT INTO agents (id, name) VALUES (?, ?)')
    const insertQualification = database.connection.prepare(
        'INSERT INTO agent_qualifications (agent_id, code, expires_on) VALUES (?, ?, ?)',
    )

    insertAgent.run('agt_1', 'Jordan Reyes')
    insertQualification.run('agt_1', 'GUARD_LICENSE', '2027-03-31')
    insertQualification.run('agt_1', 'FIRST_AID', '2026-11-30')
    insertAgent.run('agt_2', 'Priya Nadeau')
    insertQualification.run('agt_2', 'GUARD_LICENSE', '2026-08-31')
    insertAgent.run('agt_3', 'Marc Tremblay')
    insertQualification.run('agt_3', 'CROWD_CONTROL', '2027-06-30')
    insertAgent.run('agt_4', 'Alex Moreau')

    return { repository: new SqliteAgentRepository(database), database, cleanup }
}

describe('SqliteAgentRepository', () => {
    it('should return an agent with all of its qualifications', async () => {
        const { repository, database, cleanup } = buildRepository()

        await expect(repository.findById('agt_1')).resolves.toEqual({
            id: 'agt_1',
            name: 'Jordan Reyes',
            qualifications: [
                { code: 'GUARD_LICENSE', expiresOn: '2027-03-31' },
                { code: 'FIRST_AID', expiresOn: '2026-11-30' },
            ],
        })

        database.close()
        cleanup()
    })

    it('should return undefined when the agent does not exist', async () => {
        const { repository, database, cleanup } = buildRepository()

        await expect(repository.findById('agt_missing')).resolves.toBeUndefined()

        database.close()
        cleanup()
    })

    it('should return every agent holding at least one of the requested codes', async () => {
        const { repository, database, cleanup } = buildRepository()

        const agents = await repository.findByQualificationCodes(['GUARD_LICENSE'])

        expect(agents.map(agent => agent.id)).toEqual(['agt_1', 'agt_2'])

        database.close()
        cleanup()
    })

    it('should return every agent when no qualification code is requested', async () => {
        const { repository, database, cleanup } = buildRepository()

        const agents = await repository.findByQualificationCodes([])

        expect(agents.map(agent => agent.id)).toEqual(['agt_1', 'agt_2', 'agt_3', 'agt_4'])
        expect(agents[3]?.qualifications).toEqual([])

        database.close()
        cleanup()
    })
})
