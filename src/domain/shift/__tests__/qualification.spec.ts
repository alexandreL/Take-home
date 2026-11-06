import { describe, expect, it } from 'vitest'
import type { Qualification } from '../model.js'
import { qualificationValidOn } from '../qualification.js'

function qualification(expiresOn: string): Qualification {
    return { code: 'GUARD_LICENSE', expiresOn }
}

describe('qualificationValidOn', () => {
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
