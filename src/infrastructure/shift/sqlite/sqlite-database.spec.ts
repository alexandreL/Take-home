import { describe, expect, it } from 'vitest'
import { createTempDatabase } from '../../../../test/support/temp-database'
import { SqliteDatabase } from './sqlite-database'

describe('SqliteDatabase', () => {
    it('should create the schema when the database file does not exist', () => {
        const { path, cleanup } = createTempDatabase()
        const database = new SqliteDatabase(path)

        const tables = database.connection
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
            .all()
            .map(row => row.name)

        expect(tables).toEqual(expect.arrayContaining(['agent_qualifications', 'agents', 'assignments', 'shift_requirements', 'shifts']))

        database.close()
        cleanup()
    })

    it('should keep the schema and its data when the database is opened again', () => {
        const { path, cleanup } = createTempDatabase()
        const first = new SqliteDatabase(path)
        first.connection.prepare('INSERT INTO agents (id, name) VALUES (?, ?)').run('agt_1', 'Jordan Reyes')
        first.close()

        const second = new SqliteDatabase(path)
        const row = second.connection.prepare('SELECT name FROM agents WHERE id = ?').get('agt_1')

        expect(row).toMatchObject({ name: 'Jordan Reyes' })

        second.close()
        cleanup()
    })
})
