import { describe, it } from 'vitest'

// Business rules of the shifts domain. This file intentionally contains
// descriptions only; assertions and production code come once they are approved.

describe('Shift eligibility', () => {
    describe('required qualifications', () => {
        it('should allow an agent who holds every qualification required by the shift')
        it('should reject an agent who holds none of the required qualifications')
        it('should reject an agent who holds only some of the required qualifications')
        it('should allow an agent who also holds qualifications that the shift does not require')
        it('should compare qualification codes exactly')
        it('should reject an agent who holds the required code only under a different case')
        it('should reject an agent whose required qualification expired before the shift starts')
        it('should reject an agent whose required qualification expires partway through the shift')
        it('should reject an agent when only one of several required qualifications is expired')
    })

    describe('qualification validity over the whole shift', () => {
        it('should treat expiresOn as the last valid UTC calendar day, inclusive')
        it('should allow a qualification that expires on the same UTC day the shift ends')
        it('should allow a qualification that expires exactly at the shift end instant')
        it('should allow a qualification that expires on the day after the shift ends')
        it('should allow a qualification that expires on the same UTC day a shift starting at midnight begins')
        it('should allow a qualification that remains valid for a multi-day shift')
        it('should reject a qualification that expires on the day before the shift ends')
        it('should reject a qualification that expires exactly at the shift start instant')
        it('should reject a qualification that expired the day before the shift starts')
        it('should reject a qualification that covers the shift start but not its end')
        it('should evaluate validity against the shift end, not its start')
        it('should evaluate expiresOn in UTC regardless of the host time zone')
    })

    describe('existing assignments', () => {
        it('should reject an agent already assigned to the shift')
        it('should allow an agent assigned to another shift that does not overlap')
        it('should reject an agent assigned to another shift that overlaps the start of the shift')
        it('should reject an agent assigned to another shift that overlaps the end of the shift')
        it('should reject an agent assigned to another shift fully contained in the shift')
        it('should reject an agent assigned to another shift that fully contains the shift')
        it('should allow an agent whose other shift ends exactly when the shift starts')
        it('should allow an agent whose other shift starts exactly when the shift ends')
    })

    describe('combined rules', () => {
        it('should reject an agent who satisfies the qualification rules but is already assigned')
        it('should reject an agent who is not assigned but lacks a valid qualification')
    })
})
