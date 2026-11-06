import { describe, it } from 'vitest'

// Business rules of the first shifts endpoint: list the agents that can be
// assigned to a given shift. This file intentionally contains descriptions only;
// the assertions and the production code come once these cases are approved.

describe('ListAvailableAgentsForShiftUseCase', () => {
    describe('shift lookup', () => {
        it('should fail with a not-found error when the requested shift does not exist')
    })

    describe('required qualifications', () => {
        it('should return an agent who holds every qualification required by the shift')
        it('should exclude an agent who holds none of the required qualifications')
        it('should exclude an agent who holds only some of the required qualifications')
        it('should return an agent who holds extra qualifications that the shift does not require')
        it('should match qualification codes exactly')
        it('should exclude an agent whose required qualification expired before the shift starts')
        it('should exclude an agent whose required qualification expires partway through the shift')
        it('should exclude an agent when only one of several required qualifications is expired')
        it('should exclude an agent who holds the required qualification code only under a different case')
    })

    describe('qualification validity over the whole shift', () => {
        it('should treat expiresOn as the last valid UTC calendar day, inclusive')
        it('should return an agent whose qualification expires on the same UTC day the shift ends')
        it('should return an agent whose qualification expires exactly at the shift end instant')
        it('should return an agent whose qualification expires on the day after the shift ends')
        it('should return an agent whose qualification expires on the same UTC day a shift starting at midnight begins')
        it('should return an agent whose qualification remains valid for a multi-day shift')
        it('should exclude an agent whose qualification expires the day before the shift ends')
        it('should exclude an agent whose qualification expires exactly at the shift start instant')
        it('should exclude an agent whose qualification expired the day before the shift starts')
        it('should exclude an agent whose qualification covers the shift start but not its end')
        it('should evaluate validity against the shift end, not its start')
        it('should interpret expiresOn in UTC regardless of the server time zone')
    })

    describe('existing assignments', () => {
        it('should exclude an agent already assigned to this shift')
        it('should exclude every agent already assigned to this shift')
        it('should return an agent assigned to another shift that does not overlap this shift')
        it('should exclude an agent assigned to another shift that overlaps the start of this shift')
        it('should exclude an agent assigned to another shift that overlaps the end of this shift')
        it('should exclude an agent assigned to another shift fully contained in this shift')
        it('should exclude an agent assigned to another shift that fully contains this shift')
        it('should return an agent whose other shift ends exactly when this shift starts')
        it('should return an agent whose other shift starts exactly when this shift ends')
        it('should ignore assignments that belong to a different shift than the requested one')
    })

    describe('result', () => {
        it('should return every eligible agent regardless of the shift headcount')
        it('should return each eligible agent at most once')
        it('should exclude an agent who satisfies some rules but fails a single one')
        it('should return an empty list when no agent satisfies every rule')
    })
})
