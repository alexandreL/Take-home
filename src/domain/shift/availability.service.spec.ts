import { describe, expect, it } from 'vitest'
import { ShiftAvailabilityService } from './availability.service.js'
import type { Agent } from './models/agent.model.js'
import type { Assignment } from './models/assignment.model.js'
import type { Qualification } from './models/qualification.model.js'
import type { Shift } from './models/shift.model.js'
import type { AgentRepository, AssignmentRepository, ShiftRepository } from './ports.js'
import { ShiftNotFoundError } from './shift-not-found.error.js'

class InMemoryShiftRepository implements ShiftRepository {
    constructor(private readonly shifts: Shift[]) {}

    async findById(shiftId: string): Promise<Shift | undefined> {
        return this.shifts.find(shift => shift.id === shiftId)
    }

    async findByIds(shiftIds: string[]): Promise<Shift[]> {
        return this.shifts.filter(shift => shiftIds.includes(shift.id))
    }
}

class InMemoryAgentRepository implements AgentRepository {
    constructor(private readonly agents: Agent[]) {}

    async findByQualificationCodes(codes: string[]): Promise<Agent[]> {
        return this.agents.filter(agent => agent.qualifications.some(qualification => codes.includes(qualification.code)))
    }
}

class InMemoryAssignmentRepository implements AssignmentRepository {
    constructor(private readonly assignments: Assignment[]) {}

    async findByAgentIds(agentIds: string[]): Promise<Assignment[]> {
        return this.assignments.filter(assignment => agentIds.includes(assignment.agentId))
    }
}

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
