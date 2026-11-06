import { describe, expect, it } from 'vitest'
import { InMemoryAgentRepository } from '../../infrastructure/shift/in-memory-agent.repository'
import { InMemoryAssignmentRepository } from '../../infrastructure/shift/in-memory-assignment.repository'
import { InMemoryShiftRepository } from '../../infrastructure/shift/in-memory-shift.repository'
import { ShiftAvailabilityService } from './availability.service'
import type { Agent } from './models/agent.model'
import type { Assignment } from './models/assignment.model'
import type { Qualification } from './models/qualification.model'
import type { Shift } from './models/shift.model'
import { ShiftNotFoundError } from './shift-not-found.error'

function agent(id: string, qualifications: Qualification[]): Agent {
    return { id, name: id, qualifications }
}

function assignment(shiftId: string, agentId: string): Assignment {
    return { id: `asg_${agentId}_${shiftId}`, shiftId, agentId }
}

function buildService(agents: Agent[], shifts: Shift[], assignments: Assignment[] = []): ShiftAvailabilityService {
    return new ShiftAvailabilityService(
        new InMemoryShiftRepository(shifts),
        new InMemoryAgentRepository(agents),
        new InMemoryAssignmentRepository(assignments),
    )
}

const validGuard: Qualification = { code: 'GUARD_LICENSE', expiresOn: '2027-03-31' }
const expiredGuard: Qualification = { code: 'GUARD_LICENSE', expiresOn: '2026-08-31' }
const crowdControl: Qualification = { code: 'CROWD_CONTROL', expiresOn: '2027-06-30' }

const target: Shift = {
    id: 'shf_1',
    site: 'Warehouse 3, Dorval',
    start: '2026-09-15T22:00:00Z',
    end: '2026-09-16T06:00:00Z',
    requiredQualifications: ['GUARD_LICENSE'],
    headcount: 2,
}

const overlapping: Shift = {
    id: 'shf_2',
    site: 'Bell Centre, Montreal',
    start: '2026-09-15T23:00:00Z',
    end: '2026-09-16T03:00:00Z',
    requiredQualifications: ['GUARD_LICENSE'],
    headcount: 1,
}

const shifts = [target, overlapping]

describe('ShiftAvailabilityService', () => {
    it('should return every agent available for the shift', async () => {
        const available = [agent('agt_1', [validGuard]), agent('agt_2', [validGuard, crowdControl])]
        const service = buildService([...available, agent('agt_3', [crowdControl])], shifts)

        await expect(service.listAvailableAgents('shf_1')).resolves.toEqual(available)
    })

    it('should fail with a not-found error when the shift does not exist', async () => {
        const service = buildService([agent('agt_1', [validGuard])], shifts)

        await expect(service.listAvailableAgents('shf_missing')).rejects.toBeInstanceOf(ShiftNotFoundError)
    })

    it('should exclude an agent who does not hold the required qualification', async () => {
        const qualified = agent('agt_1', [validGuard])
        const service = buildService([qualified, agent('agt_2', [expiredGuard])], shifts)

        await expect(service.listAvailableAgents('shf_1')).resolves.toEqual([qualified])
    })

    it('should exclude an agent already booked on an overlapping shift', async () => {
        const free = agent('agt_1', [validGuard])
        const booked = agent('agt_2', [validGuard])
        const service = buildService([free, booked], shifts, [assignment('shf_2', 'agt_2')])

        await expect(service.listAvailableAgents('shf_1')).resolves.toEqual([free])
    })
})
