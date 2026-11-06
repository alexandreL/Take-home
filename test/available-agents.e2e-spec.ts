import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module'

describe('GET /api/shifts/:shiftId/available-agents', () => {
    let app: INestApplication

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
        app = moduleRef.createNestApplication()
        await app.init()
    })

    afterAll(async () => {
        await app.close()
    })

    it('should return the agents available for the shift', async () => {
        const response = await request(app.getHttpServer()).get('/api/shifts/shf_1/available-agents').expect(200)

        expect(response.body).toEqual({
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

    it('should return 404 when the shift does not exist', async () => {
        const response = await request(app.getHttpServer()).get('/api/shifts/shf_unknown/available-agents').expect(404)

        expect(response.body).toMatchObject({ statusCode: 404 })
    })
})
