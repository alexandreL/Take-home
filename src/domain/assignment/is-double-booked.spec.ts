import { describe, it } from 'vitest'

// Descriptions only, one criterion at a time. No assertions yet.

describe('isDoubleBooked', () => {
    it('should not report an agent who has no assignment')
    it('should report an agent already assigned to the shift')
    it('should report an agent assigned to a shift that overlaps the start of the shift')
    it('should report an agent assigned to a shift that overlaps the end of the shift')
    it('should report an agent assigned to a shift fully contained in the shift')
    it('should report an agent assigned to a shift that fully contains the shift')
    it('should report an agent assigned to a shift identical to the shift')
    it('should not report an agent whose other shift ends exactly when the shift starts')
    it('should not report an agent whose other shift starts exactly when the shift ends')
    it('should not report an agent whose other shift takes place on another day')
    it('should ignore assignments that belong to another agent')
    it('should report an agent when at least one of several assignments overlaps')
})
