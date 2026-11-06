import { describe, it } from 'vitest'

// Descriptions only. Composite criterion: runs the other checks over the whole
// agent list. No assertions yet.

describe('availableAgents', () => {
    it('should return every agent who meets the requirements and is not double booked')
    it('should exclude an agent who does not meet the requirements')
    it('should exclude an agent who is double booked')
    it('should exclude an agent who both fails the requirements and is double booked')
    it('should evaluate every agent in the input list')
    it('should not limit the result to the shift headcount')
    it('should return an empty list when no agent is available')
})
