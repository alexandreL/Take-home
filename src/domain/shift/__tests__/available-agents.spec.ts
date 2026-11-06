import { describe, expect, it } from 'vitest'
import { availableAgents } from '../available-agents.js'
import type { Agent, Assignment, Qualification, Shift } from '../model.js'

function agent(id: string, qualifications: Qualification[]): Agent {
    return { id, name: id, qualifications }
}

function assignment(shiftId: string, agentId: string): Assignment {
    return { id: `asg_${agentId}_${shiftId}`, shiftId, agentId }
}

const validGuard: Qualification = { code: 'GUARD_LICENSE', expiresOn: '2027-03-31' }
const expiredGuard: Qualification = { code: 'GUARD_LICENSE', expiresOn: '2026-08-31' }

const target: Shift = {
    id: 'shf_1',
    site: 'Warehouse 3, Dorval',
    start: '2026-09-15T22:00:00Z',
    end: '2026-09-16T06:00:00Z',
    requiredQualifications: ['GUARD_LICENSE'],
    headcount: 1,
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

describe('availableAgents', () => {
    it('should return every agent who meets the requirements and is not double booked', () => {
        const agents = [agent('agt_1', [validGuard]), agent('agt_2', [validGuard])]

        expect(availableAgents(agents, target, [], shifts)).toEqual(agents)
    })

    it('should exclude an agent who does not meet the requirements', () => {
        const eligible = agent('agt_1', [validGuard])
        const unqualified = agent('agt_2', [expiredGuard])

        expect(availableAgents([eligible, unqualified], target, [], shifts)).toEqual([eligible])
    })

    it('should exclude an agent who is double booked', () => {
        const free = agent('agt_1', [validGuard])
        const booked = agent('agt_2', [validGuard])

        expect(availableAgents([free, booked], target, [assignment('shf_2', 'agt_2')], shifts)).toEqual([free])
    })

    it('should exclude an agent who both fails the requirements and is double booked', () => {
        const free = agent('agt_1', [validGuard])
        const neither = agent('agt_3', [expiredGuard])

        expect(availableAgents([free, neither], target, [assignment('shf_2', 'agt_3')], shifts)).toEqual([free])
    })

    it('should evaluate every agent in the input list', () => {
        const agents = [agent('agt_1', [expiredGuard]), agent('agt_2', [validGuard]), agent('agt_3', [expiredGuard])]

        expect(availableAgents(agents, target, [], shifts)).toEqual([agents[1]])
    })

    it('should not limit the result to the shift headcount', () => {
        const agents = [agent('agt_1', [validGuard]), agent('agt_2', [validGuard]), agent('agt_3', [validGuard])]

        expect(target.headcount).toBe(1)
        expect(availableAgents(agents, target, [], shifts)).toHaveLength(3)
    })

    it('should return an empty list when no agent is available', () => {
        const agents = [agent('agt_1', [expiredGuard]), agent('agt_2', [expiredGuard])]

        expect(availableAgents(agents, target, [], shifts)).toEqual([])
    })
})
