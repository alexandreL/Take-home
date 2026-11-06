import { describe, it } from 'vitest'

// Service-level descriptions only. Implementation comes once these are approved.

describe('AssignmentService', () => {
    it('should create an assignment when the agent is available for the shift')
    it('should return the created assignment with its id, shiftId and agentId')
    it('should fail with a not-found error when the shift does not exist')
    it('should reject an agent who does not exist')
    it('should reject an agent who does not hold every required qualification')
    it('should reject an agent whose required qualification has expired')
    it('should reject an agent already assigned to this shift')
    it('should reject an agent booked on an overlapping shift')
    it('should accept an agent for a shift that requires no qualification')
    it('should not persist any assignment when the agent is not available')
})
