import { describe, expect, it } from 'vitest'
import { meetsRequirements } from '../meets-requirements.js'
import type { Agent, Qualification, Shift } from '../model.js'

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

describe('meetsRequirements', () => {
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

    it('should not meet a shift when the required qualification expires partway through the shift', () => {
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-15')]), shift(['GUARD_LICENSE']))).toBe(false)
    })

    it('should not meet a shift when only one of several required qualifications is expired', () => {
        const expiredCrowdControl = qualification('CROWD_CONTROL', '2026-09-15')
        expect(meetsRequirements(agent([validGuard, expiredCrowdControl]), shift(['GUARD_LICENSE', 'CROWD_CONTROL']))).toBe(false)
    })

    it('should meet a shift when the qualification expires on the same UTC day the shift ends', () => {
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-16')]), shift(['GUARD_LICENSE']))).toBe(true)
    })

    it('should meet a shift when the qualification expires exactly at the shift end instant', () => {
        const endsAtMidnight = shift(['GUARD_LICENSE'], '2026-09-15T22:00:00Z', '2026-09-17T00:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-16')]), endsAtMidnight)).toBe(true)
    })

    it('should meet a shift when the qualification expires after the shift ends', () => {
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-17')]), shift(['GUARD_LICENSE']))).toBe(true)
    })

    it('should not meet a shift when the qualification expires exactly at the shift start instant', () => {
        const startsAtMidnight = shift(['GUARD_LICENSE'], '2026-09-16T00:00:00Z', '2026-09-16T06:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-15')]), startsAtMidnight)).toBe(false)
    })

    it('should meet a multi-day shift only when the qualification covers its last day', () => {
        const multiDay = shift(['GUARD_LICENSE'], '2026-09-10T22:00:00Z', '2026-09-20T06:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-19')]), multiDay)).toBe(false)
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-20')]), multiDay)).toBe(true)
    })

    it('should evaluate validity against the shift end, not its start', () => {
        const longShift = shift(['GUARD_LICENSE'], '2026-09-15T22:00:00Z', '2026-09-18T06:00:00Z')
        expect(meetsRequirements(agent([qualification('GUARD_LICENSE', '2026-09-16')]), longShift)).toBe(false)
    })
})
