import { describe, it } from 'vitest'

// Descriptions only, one criterion at a time. No assertions yet.

describe('meetsRequirements', () => {
    it('should meet a shift that requires no qualification')
    it('should meet a shift when the agent holds its only required qualification')
    it('should meet a shift when the agent holds every required qualification')
    it('should meet a shift when the agent holds extra qualifications that are not required')
    it('should not meet a shift when the agent holds none of the required qualifications')
    it('should not meet a shift when the agent holds only some of the required qualifications')
    it('should compare qualification codes exactly')
    it('should not meet a shift when the required code is held under a different case')
    it('should not meet a shift when the required qualification expired before the shift starts')
    it('should not meet a shift when the required qualification expires partway through the shift')
    it('should not meet a shift when only one of several required qualifications is expired')
    it('should meet a shift when the qualification expires on the same UTC day the shift ends')
    it('should meet a shift when the qualification expires exactly at the shift end instant')
    it('should meet a shift when the qualification expires after the shift ends')
    it('should not meet a shift when the qualification expires exactly at the shift start instant')
    it('should meet a multi-day shift only when the qualification covers its last day')
    it('should evaluate validity against the shift end, not its start')
})
