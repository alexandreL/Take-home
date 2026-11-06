import { fileURLToPath } from 'node:url'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module'
import { seedDatabase } from './support/seed-database'
import { createTempDatabase, type TempDatabase } from './support/temp-database'

interface AvailableAgent {
    id: string
    name: string
}

// Jordan also holds CROWD_CONTROL in the fixture, so that on shf_2 the only
// reason to exclude him is the overlap with the shift he is booked on.
const FIXTURE = fileURLToPath(new URL('./fixtures/availability.json', import.meta.url))

describe('GET /api/shifts/:shiftId/available-agents', () => {
    let app: INestApplication
    let database: TempDatabase

    beforeAll(async () => {
        database = createTempDatabase()
        await seedDatabase(FIXTURE, database.path)
        process.env.DATABASE_PATH = database.path

        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
        app = moduleRef.createNestApplication()
        await app.init()
    })

    afterAll(async () => {
        await app.close()
        delete process.env.DATABASE_PATH
        database.cleanup()
    })

    async function getAvailableAgents(shiftId: string): Promise<AvailableAgent[]> {
        const response = await request(app.getHttpServer()).get(`/api/shifts/${shiftId}/available-agents`).expect(200)

        return response.body as AvailableAgent[]
    }

    it('should return only Marc for shf_1', async () => {
        const agents = await getAvailableAgents('shf_1')

        expect(agents).toEqual([{ id: 'agt_3', name: 'Marc Tremblay' }])
    })

    it('should return only Marc for shf_2', async () => {
        const agents = await getAvailableAgents('shf_2')

        expect(agents).toEqual([{ id: 'agt_3', name: 'Marc Tremblay' }])
    })

    it('should exclude an agent whose required qualification has expired', async () => {
        const agents = await getAvailableAgents('shf_1')

        // Priya's GUARD_LICENSE expired on 2026-08-31, before the shift starts.
        expect(agents.map(agent => agent.id)).not.toContain('agt_2')
    })

    it('should exclude an agent booked on an overlapping shift', async () => {
        const agents = await getAvailableAgents('shf_2')

        // Jordan is assigned to shf_1, whose 22:00-06:00 window overlaps shf_2.
        expect(agents.map(agent => agent.id)).not.toContain('agt_1')
    })

    it('should return an empty array when nobody is available', async () => {
        const agents = await getAvailableAgents('shf_3')

        expect(agents).toEqual([])
    })

    it('should return 404 when the shift does not exist', async () => {
        const response = await request(app.getHttpServer()).get('/api/shifts/shf_unknown/available-agents').expect(404)

        expect(response.body).toMatchObject({ statusCode: 404 })
    })
})
