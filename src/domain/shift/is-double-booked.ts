import type { Assignment, Shift } from './model.js'

/**
 * Whether the agent is already committed on a shift whose window overlaps this one,
 * including this shift itself.
 *
 * `shifts` is the catalogue used to resolve the window of each assignment; an
 * assignment whose shift is unknown is ignored.
 */
export function isDoubleBooked(agentId: string, shift: Shift, assignments: Assignment[], shifts: Shift[]): boolean {
    const window = { start: Date.parse(shift.start), end: Date.parse(shift.end) }

    return assignments.some(assignment => {
        if (assignment.agentId !== agentId) {
            return false
        }

        const bookedShift = shifts.find(candidate => candidate.id === assignment.shiftId)
        if (bookedShift === undefined) {
            return false
        }

        // Half-open windows: a shift ending when this one starts is not an overlap.
        return Date.parse(bookedShift.start) < window.end && Date.parse(bookedShift.end) > window.start
    })
}
