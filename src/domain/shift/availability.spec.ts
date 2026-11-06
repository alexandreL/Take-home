import { describe, expect, it } from 'vitest'
import { availableAgents, isDoubleBooked, meetsRequirements, qualificationValidOn } from './availability'
import type { Agent } from './models/agent.model'
import type { Assignment } from './models/assignment.model'
import type { Qualification } from './models/qualification.model'
import type { Shift } from './models/shift.model'

describe('qualificationValidOn', () => {
    function qualification(expiresOn: string): Qualification {
        return { code: 'GUARD_LICENSE', expiresOn }
    }

    it('should be valid on a calendar day before expiresOn', () => {
        expect(qualificationValidOn(qualification('2026-09-16'), new Date('2026-09-15T12:00:00Z'))).toBe(true)
    })

    it('should be valid on expiresOn itself', () => {
        expect(qualificationValidOn(qualification('2026-09-16'), new Date('2026-09-16T00:00:00Z'))).toBe(true)
    })

    it('should not be valid on the day after expiresOn', () => {
        expect(qualificationValidOn(qualification('2026-09-16'), new Date('2026-09-17T00:00:00Z'))).toBe(false)
    })

    it('should not be valid for a qualification that expired long ago', () => {
        expect(qualificationValidOn(qualification('2020-01-01'), new Date('2026-09-15T12:00:00Z'))).toBe(false)
    })

    it('should not be valid for an expiresOn that falls in an earlier year', () => {
        expect(qualificationValidOn(qualification('2025-12-31'), new Date('2026-01-01T00:00:00Z'))).toBe(false)
    })

    it('should compare calendar days in UTC regardless of the host time zone', () => {
        // Late evening UTC is already the next calendar day in every zone east of UTC.
        expect(qualificationValidOn(qualification('2026-09-16'), new Date('2026-09-16T23:30:00Z'))).toBe(true)
        expect(qualificationValidOn(qualification('2026-09-16'), new Date('2026-09-17T00:30:00Z'))).toBe(false)
    })

    it('should only depend on the expiry day, not on the time the check runs', () => {
        expect(qualificationValidOn(qualification('2026-09-16'), new Date('2026-09-16T00:00:00.000Z'))).toBe(true)
        expect(qualificationValidOn(qualification('2026-09-16'), new Date('2026-09-16T23:59:59.999Z'))).toBe(true)
    })
})

describe('meetsRequirements', () => {
    function agent(qualifications: Qualification[]): Agent {
        return { id: 'agt_1', name: 'Jordan Reyes', qualifications }
    }

    function qualification(code: string, expiresOn: string): Qualification {
        return { code, expiresOn }
    }

    function shift(requiredQualifications: string[], start = '2026-09-15T22:00:00Z', end = '2026-09-16T06:00:00Z'): Shift {
        return { id: 'shf_1', site: 'Warehouse 3, Dorval', start, end, requiredQualifications, headcount: 2 }
    }

    const validGuard = qualification('GUARD_LICENSE', '2027-03-31')
    const validCrowdControl = qualification('CROWD_CONTROL', '2027-06-30')
    const firstAid = qualification('FIRST_AID', '2026-11-30')

    it('should meet a shift that requires no qualification', () => {
        expect(meetsRequirements(agent([]), shift([]))).toBe(true)
    })

    it('should meet a shift when the agent holds its only required qualification', () => {
        expect(meetsRequirements(agent([validGuard]), shift(['GUARD_LICENSE']))).toBe(true)
    })

    it('should meet a shift when the agent holds every required qualification', () => {
        expect(meetsRequirements(agent([validGuard, validCrowdControl]), shift(['GUARD_LICENSE', 'CROWD_CONTROL']))).toBe(true)
    })

    it('should meet a shift when the agent holds extra qualifications that are not required', () => {
        expect(meetsRequirements(agent([validGuard, firstAid]), shift(['GUARD_LICENSE']))).toBe(true)
    })

    it('should not meet a shift when the agent holds none of the required qualifications', () => {
        expect(meetsRequirements(agent([]), shift(['GUARD_LICENSE']))).toBe(false)
    })

    it('should not meet a shift when the agent holds only some of the required qualifications', () => {
        expect(meetsRequirements(agent([validGuard]), shift(['GUARD_LICENSE', 'CROWD_CONTROL']))).toBe(false)
    })

    it('should compare qualification codes exactly', () => {
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE_RENEWAL', '2027-03-31')]), shift(['GUARD_LICENSE']))).toBe(false)
    })

    it('should not meet a shift when the required code is held under a different case', () => {
        expect(meetsRequirements(agent([qualification('guard_license', '2027-03-31')]), shift(['GUARD_LICENSE']))).toBe(false)
    })

    it('should not meet a shift when the required qualification expired before the shift starts', () => {
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-14')]), shift(['GUARD_LICENSE']))).toBe(false)
    })

    it('should not meet a shift when only one of several required qualifications is expired', () => {
        const expiredCrowdControl = qualification('CROWD_CONTROL', '2026-09-14')
        expect(meetsRequirements(agent([validGuard, expiredCrowdControl]), shift(['GUARD_LICENSE', 'CROWD_CONTROL']))).toBe(false)
    })

    it('should meet a shift when the qualification expires on the same UTC day the shift starts', () => {
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-15')]), shift(['GUARD_LICENSE']))).toBe(true)
    })

    it('should not meet a shift when the qualification expired the day before the shift starts', () => {
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-14')]), shift(['GUARD_LICENSE']))).toBe(false)
    })

    it('should not meet a shift starting at midnight when the qualification expired the previous day', () => {
        const startsAtMidnight = shift(['GUARD_LICENSE'], '2026-09-16T00:00:00Z', '2026-09-16T06:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-15')]), startsAtMidnight)).toBe(false)
    })

    it('should meet a shift when the qualification expires before the shift ends', () => {
        const longShift = shift(['GUARD_LICENSE'], '2026-09-15T22:00:00Z', '2026-09-18T06:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-16')]), longShift)).toBe(true)
    })

    it('should meet a multi-day shift as soon as the qualification covers its first day', () => {
        const multiDay = shift(['GUARD_LICENSE'], '2026-09-10T22:00:00Z', '2026-09-20T06:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-10')]), multiDay)).toBe(true)
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-09')]), multiDay)).toBe(false)
    })

    it('should evaluate validity against the shift start, not its end', () => {
        const longShift = shift(['GUARD_LICENSE'], '2026-09-15T22:00:00Z', '2026-09-18T06:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-15')]), longShift)).toBe(true)
    })
})

describe('isDoubleBooked', () => {
    function shift(id: string, start: string, end: string): Shift {
        return { id, site: 'Site', start, end, requiredQualifications: [], headcount: 1 }
    }

    function assignment(shiftId: string, agentId = 'agt_1'): Assignment {
        return { id: `asg_${shiftId}`, shiftId, agentId }
    }

    const target = shift('shf_1', '2026-09-15T22:00:00Z', '2026-09-16T06:00:00Z')

    it('should not report an agent who has no assignment', () => {
        expect(isDoubleBooked('agt_1', target, [], [target])).toBe(false)
    })

    it('should report an agent already assigned to the shift', () => {
        expect(isDoubleBooked('agt_1', target, [assignment('shf_1')], [target])).toBe(true)
    })

    it('should report an agent assigned to a shift that overlaps the start of the shift', () => {
        const overlappingStart = shift('shf_2', '2026-09-15T21:00:00Z', '2026-09-15T23:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_2')], [target, overlappingStart])).toBe(true)
    })

    it('should report an agent assigned to a shift that overlaps the end of the shift', () => {
        const overlappingEnd = shift('shf_3', '2026-09-16T05:00:00Z', '2026-09-16T07:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_3')], [target, overlappingEnd])).toBe(true)
    })

    it('should report an agent assigned to a shift fully contained in the shift', () => {
        const contained = shift('shf_4', '2026-09-15T23:00:00Z', '2026-09-16T01:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_4')], [target, contained])).toBe(true)
    })

    it('should report an agent assigned to a shift that fully contains the shift', () => {
        const containing = shift('shf_5', '2026-09-15T20:00:00Z', '2026-09-16T08:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_5')], [target, containing])).toBe(true)
    })

    it('should report an agent assigned to a shift identical to the shift', () => {
        const identical = shift('shf_6', '2026-09-15T22:00:00Z', '2026-09-16T06:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_6')], [target, identical])).toBe(true)
    })

    it('should not report an agent whose other shift ends exactly when the shift starts', () => {
        const endsAtStart = shift('shf_7', '2026-09-15T20:00:00Z', '2026-09-15T22:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_7')], [target, endsAtStart])).toBe(false)
    })

    it('should not report an agent whose other shift starts exactly when the shift ends', () => {
        const startsAtEnd = shift('shf_8', '2026-09-16T06:00:00Z', '2026-09-16T08:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_8')], [target, startsAtEnd])).toBe(false)
    })

    it('should not report an agent whose other shift takes place on another day', () => {
        const anotherDay = shift('shf_9', '2026-09-20T22:00:00Z', '2026-09-21T06:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_9')], [target, anotherDay])).toBe(false)
    })

    it('should ignore assignments that belong to another agent', () => {
        expect(isDoubleBooked('agt_1', target, [assignment('shf_1', 'agt_2')], [target])).toBe(false)
    })

    it('should report an agent when at least one of several assignments overlaps', () => {
        const anotherDay = shift('shf_9', '2026-09-20T22:00:00Z', '2026-09-21T06:00:00Z')
        const overlapping = shift('shf_10', '2026-09-16T04:00:00Z', '2026-09-16T09:00:00Z')
        const assignments = [assignment('shf_9'), assignment('shf_10')]
        expect(isDoubleBooked('agt_1', target, assignments, [target, anotherDay, overlapping])).toBe(true)
    })

    it('should ignore an assignment whose shift is not in the catalogue', () => {
        expect(isDoubleBooked('agt_1', target, [assignment('shf_unknown')], [target])).toBe(false)
    })
})

describe('availableAgents', () => {
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
