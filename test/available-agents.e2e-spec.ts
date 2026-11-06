import { fileURLToPath } from 'node:url'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module.js'

interface AvailableAgentsBody {
    agents: { id: string; name: string; qualifications: { code: string; expiresOn: string }[] }[]
}

// Jordan also holds CROWD_CONTROL in the fixture, so that on shf_2 the only
// reason to exclude him is the overlap with the shift he is booked on.
const DATABASE_PATH = fileURLToPath(new URL('./fixtures/availability.json', import.meta.url))

describe('GET /api/shifts/:shiftId/available-agents', () => {
    let app: INestApplication

    beforeAll(async () => {
        process.env.DATABASE_PATH = DATABASE_PATH

        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
        app = moduleRef.createNestApplication()
        await app.init()
    })

    afterAll(async () => {
        await app.close()
        process.env.DATABASE_PATH = undefined
    })

    async function getAvailableAgents(shiftId: string): Promise<AvailableAgentsBody> {
        const response = await request(app.getHttpServer()).get(`/api/shifts/${shiftId}/available-agents`).expect(200)

        return response.body as AvailableAgentsBody
    }

    function ids(body: AvailableAgentsBody): string[] {
        return body.agents.map(agent => agent.id)
    }

    it('should return only Marc for shf_1', async () => {
        const body = await getAvailableAgents('shf_1')

        expect(body).toEqual({
            agents: [
                {
                    id: 'agt_3',
                    name: 'Marc Tremblay',
                    qualifications: [
                        { code: 'GUARD_LICENSE', expiresOn: '2028-01-15' },
                        { code: 'CROWD_CONTROL', expiresOn: '2027-06-30' },
                    ],
                },
            ],
        })
    })

    it('should return only Marc for shf_2', async () => {
        const body = await getAvailableAgents('shf_2')

        expect(body).toEqual({
            agents: [
                {
                    id: 'agt_3',
                    name: 'Marc Tremblay',
                    qualifications: [
                        { code: 'GUARD_LICENSE', expiresOn: '2028-01-15' },
                        { code: 'CROWD_CONTROL', expiresOn: '2027-06-30' },
                    ],
                },
            ],
        })
    })

    it('should exclude an agent whose required qualification has expired', async () => {
        const body = await getAvailableAgents('shf_1')

        // Priya's GUARD_LICENSE expired on 2026-08-31, before the shift ends.
        expect(ids(body)).not.toContain('agt_2')
    })

    it('should exclude an agent booked on an overlapping shift', async () => {
        const body = await getAvailableAgents('shf_2')

        // Jordan is assigned to shf_1, whose 22:00-06:00 window overlaps shf_2.
        expect(ids(body)).not.toContain('agt_1')
    })

    it('should return 404 when the shift does not exist', async () => {
        const response = await request(app.getHttpServer()).get('/api/shifts/shf_unknown/available-agents').expect(404)

        expect(response.body).toMatchObject({ statusCode: 404 })
    })
})
