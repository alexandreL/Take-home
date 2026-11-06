import { randomUUID } from 'node:crypto'
import { copyFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module'

const FIXTURE = fileURLToPath(new URL('./fixtures/assignments.json', import.meta.url))

describe('POST /api/shifts/:shiftId/assignments', () => {
    let app: INestApplication
    let databasePath: string

    beforeEach(async () => {
        // The endpoint writes to the database: each test gets a fresh copy of the
        // fixture so the scenarios stay independent and the repository file is never
        // mutated.
        databasePath = join(tmpdir(), `assignments-${randomUUID()}.json`)
        await copyFile(FIXTURE, databasePath)
        process.env.DATABASE_PATH = databasePath

        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
        app = moduleRef.createNestApplication()
        await app.init()
    })

    afterEach(async () => {
        await app.close()
        delete process.env.DATABASE_PATH
        await rm(databasePath, { force: true })
    })

    function createAssignment(shiftId: string, body: { agentId: string }): request.Test {
        return request(app.getHttpServer()).post(`/api/shifts/${shiftId}/assignments`).send(body)
    }

    it('should create an assignment and return it', async () => {
        const response = await createAssignment('shf_2', { agentId: 'agt_3' }).expect(201)

        expect(response.body).toEqual({ id: 'asg_2', shiftId: 'shf_2', agentId: 'agt_3' })
    })

    it('should persist the assignment in the JSON database', async () => {
        await createAssignment('shf_2', { agentId: 'agt_3' }).expect(201)

        const stored = JSON.parse(await readFile(databasePath, 'utf8')) as { assignments: unknown[] }
        expect(stored.assignments).toContainEqual({ id: 'asg_2', shiftId: 'shf_2', agentId: 'agt_3' })
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

    it('should return 404 when the shift does not exist', async () => {
        await createAssignment('shf_unknown', { agentId: 'agt_3' }).expect(404)
    })

    it('should return 404 when the agent does not exist', async () => {
        await createAssignment('shf_1', { agentId: 'agt_unknown' }).expect(404)
    })

    it('should return 422 when the agent qualification has expired', async () => {
        await createAssignment('shf_1', { agentId: 'agt_2' }).expect(422)
    })

    it('should return 422 when the agent is booked on an overlapping shift', async () => {
        await createAssignment('shf_2', { agentId: 'agt_1' }).expect(422)
    })

    it('should return 409 when the shift is full', async () => {
        await createAssignment('shf_1', { agentId: 'agt_3' }).expect(201)

        await createAssignment('shf_1', { agentId: 'agt_4' }).expect(409)
    })
})
