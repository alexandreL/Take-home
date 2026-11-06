import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module'
import { seedDatabase } from './support/seed-database'
import { createTempDatabase, type TempDatabase } from './support/temp-database'

const FIXTURE = fileURLToPath(new URL('./fixtures/assignments.json', import.meta.url))

describe('POST /api/shifts/:shiftId/assignments', () => {
    let app: INestApplication
    let database: TempDatabase

    beforeEach(async () => {
        // The endpoint writes to the database: each test gets its own SQLite file,
        // seeded from the fixture, so the scenarios stay independent.
        database = createTempDatabase()
        await seedDatabase(FIXTURE, database.path)
        process.env.DATABASE_PATH = database.path

        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
        app = moduleRef.createNestApplication()
        await app.init()
    })

    afterEach(async () => {
        await app.close()
        delete process.env.DATABASE_PATH
        database.cleanup()
    })

    function createAssignment(shiftId: string, body: { agentId: string }): request.Test {
        return request(app.getHttpServer()).post(`/api/shifts/${shiftId}/assignments`).send(body)
    }

    function storedAssignments(): unknown[] {
        const connection = new DatabaseSync(database.path, { readOnly: true })

        try {
            return connection.prepare('SELECT id, shift_id, agent_id FROM assignments ORDER BY id').all()
        } finally {
            connection.close()
        }
    }

    it('should create an assignment and return it', async () => {
        const response = await createAssignment('shf_2', { agentId: 'agt_3' }).expect(201)

        expect(response.body).toEqual({ id: 'asg_2', shiftId: 'shf_2', agentId: 'agt_3' })
    })

    it('should persist the assignment in the SQLite database', async () => {
        await createAssignment('shf_2', { agentId: 'agt_3' }).expect(201)

        expect(storedAssignments()).toContainEqual({ id: 'asg_2', shift_id: 'shf_2', agent_id: 'agt_3' })
    })

    it('should reflect the new assignment in the availability list', async () => {
        await createAssignment('shf_2', { agentId: 'agt_3' }).expect(201)

        const response = await request(app.getHttpServer()).get('/api/shifts/shf_2/available-agents').expect(200)

        expect(response.body).toEqual([])
    })

    it('should still see the assignment after a restart', async () => {
        await createAssignment('shf_2', { agentId: 'agt_3' }).expect(201)

        await app.close()
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
        app = moduleRef.createNestApplication()
        await app.init()

        const response = await request(app.getHttpServer()).get('/api/shifts/shf_2/available-agents').expect(200)

        expect(response.body).toEqual([])
    })

    it('should remove the booked agent from every overlapping shift', async () => {
        const before = await request(app.getHttpServer()).get('/api/shifts/shf_1/available-agents').expect(200)
        expect(before.body.map((agent: { id: string }) => agent.id)).toContain('agt_3')

        // shf_1 runs 22:00-06:00, shf_2 runs 23:00-03:00: they overlap.
        await createAssignment('shf_2', { agentId: 'agt_3' }).expect(201)

        const after = await request(app.getHttpServer()).get('/api/shifts/shf_1/available-agents').expect(200)
        expect(after.body.map((agent: { id: string }) => agent.id)).not.toContain('agt_3')
    })

    it('should return 404 when the shift does not exist', async () => {
        await createAssignment('shf_unknown', { agentId: 'agt_3' }).expect(404)
    })

    it('should return 404 when the agent does not exist', async () => {
        await createAssignment('shf_1', { agentId: 'agt_unknown' }).expect(404)
    })

    it('should return 422 when the agent qualification has expired', async () => {
        const before = storedAssignments()

        await createAssignment('shf_1', { agentId: 'agt_2' }).expect(422)

        expect(storedAssignments()).toEqual(before)
    })

    it('should return 422 when the agent is booked on an overlapping shift', async () => {
        await createAssignment('shf_2', { agentId: 'agt_1' }).expect(422)
    })

    it('should return 409 when the shift is full and write nothing', async () => {
        await createAssignment('shf_1', { agentId: 'agt_3' }).expect(201)
        const afterBooking = storedAssignments()

        await createAssignment('shf_1', { agentId: 'agt_4' }).expect(409)

        expect(storedAssignments()).toEqual(afterBooking)
    })
})
