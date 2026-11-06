import { describe, it } from 'vitest'

// Service-level descriptions only. The orchestration and the repository ports
// come once the retrieval strategy below is agreed on.

describe('ShiftAvailabilityService', () => {
    it('should return every agent available for the shift')
    it('should fail with a not-found error when the shift does not exist')
    it('should exclude an agent who does not hold the required qualification')
    it('should exclude an agent already booked on an overlapping shift')
})
