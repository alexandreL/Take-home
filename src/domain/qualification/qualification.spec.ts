import { describe, it } from 'vitest'

// Descriptions only, one criterion at a time. No assertions yet.

describe('qualificationValidOn', () => {
    it('should be valid on a calendar day before expiresOn')
    it('should be valid on expiresOn itself')
    it('should not be valid on the day after expiresOn')
    it('should not be valid for a qualification that expired long ago')
    it('should not be valid for an expiresOn that falls in an earlier year')
    it('should compare calendar days in UTC regardless of the host time zone')
    it('should only depend on the expiry day, not on the time the check runs')
})
