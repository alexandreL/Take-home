import { describe, expect, it } from 'vitest'
import { isDoubleBooked } from '../is-double-booked.js'
import type { Assignment, Shift } from '../model.js'

function shift(id: string, start: string, end: string): Shift {
    return { id, site: 'Site', start, end, requiredQualifications: [], headcount: 1 }
}

function assignment(shiftId: string, agentId = 'agt_1'): Assignment {
    return { id: `asg_${shiftId}`, shiftId, agentId }
}

const target = shift('shf_1', '2026-09-15T22:00:00Z', '2026-09-16T06:00:00Z')

describe('isDoubleBooked', () => {
    it('should not report an agent who has no assignment', () => {
        expect(isDoubleBooked('agt_1', target, [], [target])).toBe(false)
    })

    it('should report an agent already assigned to the shift', () => {
        expect(isDoubleBooked('agt_1', target, [assignment('shf_1')], [target])).toBe(true)
    })

    it('should report an agent assigned to a shift that overlaps the start of the shift', () => {
        const overlappingStart = shift('shf_2', '2026-09-15T21:00:00Z', '2026-09-15T23:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_2')], [target, overlappingStart])).toBe(true)
    })

    it('should report an agent assigned to a shift that overlaps the end of the shift', () => {
        const overlappingEnd = shift('shf_3', '2026-09-16T05:00:00Z', '2026-09-16T07:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_3')], [target, overlappingEnd])).toBe(true)
    })

    it('should report an agent assigned to a shift fully contained in the shift', () => {
        const contained = shift('shf_4', '2026-09-15T23:00:00Z', '2026-09-16T01:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_4')], [target, contained])).toBe(true)
    })

    it('should report an agent assigned to a shift that fully contains the shift', () => {
        const containing = shift('shf_5', '2026-09-15T20:00:00Z', '2026-09-16T08:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_5')], [target, containing])).toBe(true)
    })

    it('should report an agent assigned to a shift identical to the shift', () => {
        const identical = shift('shf_6', '2026-09-15T22:00:00Z', '2026-09-16T06:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_6')], [target, identical])).toBe(true)
    })

    it('should not report an agent whose other shift ends exactly when the shift starts', () => {
        const endsAtStart = shift('shf_7', '2026-09-15T20:00:00Z', '2026-09-15T22:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_7')], [target, endsAtStart])).toBe(false)
    })

    it('should not report an agent whose other shift starts exactly when the shift ends', () => {
        const startsAtEnd = shift('shf_8', '2026-09-16T06:00:00Z', '2026-09-16T08:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_8')], [target, startsAtEnd])).toBe(false)
    })

    it('should not report an agent whose other shift takes place on another day', () => {
        const anotherDay = shift('shf_9', '2026-09-20T22:00:00Z', '2026-09-21T06:00:00Z')
        expect(isDoubleBooked('agt_1', target, [assignment('shf_9')], [target, anotherDay])).toBe(false)
    })

    it('should ignore assignments that belong to another agent', () => {
        expect(isDoubleBooked('agt_1', target, [assignment('shf_1', 'agt_2')], [target])).toBe(false)
    })

    it('should report an agent when at least one of several assignments overlaps', () => {
        const anotherDay = shift('shf_9', '2026-09-20T22:00:00Z', '2026-09-21T06:00:00Z')
        const overlapping = shift('shf_10', '2026-09-16T04:00:00Z', '2026-09-16T09:00:00Z')
        const assignments = [assignment('shf_9'), assignment('shf_10')]
        expect(isDoubleBooked('agt_1', target, assignments, [target, anotherDay, overlapping])).toBe(true)
    })

    it('should ignore an assignment whose shift is not in the catalogue', () => {
        expect(isDoubleBooked('agt_1', target, [assignment('shf_unknown')], [target])).toBe(false)
    })
})
