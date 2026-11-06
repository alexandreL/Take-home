import { describe, expect, it } from 'vitest'
import { InMemoryAgentRepository } from '../../infrastructure/shift/in-memory/in-memory-agent.repository'
import { InMemoryAssignmentRepository } from '../../infrastructure/shift/in-memory/in-memory-assignment.repository'
import { InMemoryShiftRepository } from '../../infrastructure/shift/in-memory/in-memory-shift.repository'
import { AgentNotAvailableError } from './agent-not-available.error'
import { AgentNotFoundError } from './agent-not-found.error'
import { AssignmentService } from './assignment.service'
import type { Agent } from './models/agent.model'
import type { Assignment } from './models/assignment.model'
import type { Qualification } from './models/qualification.model'
import type { Shift } from './models/shift.model'
import { ShiftFullError } from './shift-full.error'
import { ShiftNotFoundError } from './shift-not-found.error'

function agent(id: string, qualifications: Qualification[]): Agent {
    return { id, name: id, qualifications }
}

const validGuard: Qualification = { code: 'GUARD_LICENSE', expiresOn: '2027-03-31' }
const expiredGuard: Qualification = { code: 'GUARD_LICENSE', expiresOn: '2026-08-31' }
const firstAid: Qualification = { code: 'FIRST_AID', expiresOn: '2027-03-31' }

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

function buildService(
    agents: Agent[],
    assignments: Assignment[] = [],
    availableShifts: Shift[] = shifts,
): { service: AssignmentService; repository: InMemoryAssignmentRepository } {
    const repository = new InMemoryAssignmentRepository(assignments)
    const service = new AssignmentService(new InMemoryShiftRepository(availableShifts), new InMemoryAgentRepository(agents), repository)

    return { service, repository }
}

describe('AssignmentService', () => {
    it('should create an assignment when the agent is available for the shift', async () => {
        const { service, repository } = buildService([agent('agt_1', [validGuard])])

        await service.assignAgent('shf_1', 'agt_1')

        expect(repository.created).toEqual([{ shiftId: 'shf_1', agentId: 'agt_1' }])
    })

    it('should return the created assignment with its id, shiftId and agentId', async () => {
        const { service } = buildService([agent('agt_1', [validGuard])])

        await expect(service.assignAgent('shf_1', 'agt_1')).resolves.toEqual({ id: 'asg_1', shiftId: 'shf_1', agentId: 'agt_1' })
    })

    it('should fail with a not-found error when the shift does not exist', async () => {
        const { service } = buildService([agent('agt_1', [validGuard])])

        await expect(service.assignAgent('shf_missing', 'agt_1')).rejects.toBeInstanceOf(ShiftNotFoundError)
    })

    it('should fail with a not-found error when the agent does not exist', async () => {
        const { service } = buildService([agent('agt_1', [validGuard])])

        await expect(service.assignAgent('shf_1', 'agt_missing')).rejects.toBeInstanceOf(AgentNotFoundError)
    })

    it('should reject when the shift headcount is already reached', async () => {
        const full: Assignment[] = [
            { id: 'asg_1', shiftId: 'shf_1', agentId: 'agt_8' },
            { id: 'asg_2', shiftId: 'shf_1', agentId: 'agt_9' },
        ]
        const { service, repository } = buildService([agent('agt_1', [validGuard])], full)

        await expect(service.assignAgent('shf_1', 'agt_1')).rejects.toBeInstanceOf(ShiftFullError)
        expect(repository.created).toEqual([])
    })

    it('should reject an agent who does not hold every required qualification', async () => {
        const { service } = buildService([agent('agt_2', [firstAid])])

        await expect(service.assignAgent('shf_1', 'agt_2')).rejects.toBeInstanceOf(AgentNotAvailableError)
    })

    it('should reject an agent whose required qualification has expired', async () => {
        const { service } = buildService([agent('agt_2', [expiredGuard])])

        await expect(service.assignAgent('shf_1', 'agt_2')).rejects.toBeInstanceOf(AgentNotAvailableError)
    })

    it('should reject an agent already assigned to this shift', async () => {
        const assigned: Assignment = { id: 'asg_1', shiftId: 'shf_1', agentId: 'agt_1' }
        const { service } = buildService([agent('agt_1', [validGuard])], [assigned])

        await expect(service.assignAgent('shf_1', 'agt_1')).rejects.toBeInstanceOf(AgentNotAvailableError)
    })

    it('should reject an agent booked on an overlapping shift', async () => {
        const booked: Assignment = { id: 'asg_1', shiftId: 'shf_2', agentId: 'agt_3' }
        const { service } = buildService([agent('agt_3', [validGuard])], [booked])

        await expect(service.assignAgent('shf_1', 'agt_3')).rejects.toBeInstanceOf(AgentNotAvailableError)
    })

    it('should accept an agent for a shift that requires no qualification', async () => {
        const openShift: Shift = { ...target, id: 'shf_3', requiredQualifications: [], headcount: 1 }
        const { service } = buildService([agent('agt_4', [])], [], [openShift])

        await expect(service.assignAgent('shf_3', 'agt_4')).resolves.toMatchObject({ shiftId: 'shf_3', agentId: 'agt_4' })
    })

    it('should not persist any assignment when the request is rejected', async () => {
        const { service, repository } = buildService([agent('agt_2', [expiredGuard])])

        await expect(service.assignAgent('shf_1', 'agt_2')).rejects.toBeInstanceOf(AgentNotAvailableError)
        expect(repository.created).toEqual([])
    })
})
