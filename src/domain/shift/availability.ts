import type { Agent } from './models/agent.model'
import type { Assignment } from './models/assignment.model'
import type { Qualification } from './models/qualification.model'
import type { Shift } from './models/shift.model'

/**
 * Whether the qualification is still valid on the given calendar day.
 *
 * Compared as UTC calendar days: a qualification expires at the end of its
 * `expiresOn` day, so it is valid on that day and invalid the day after.
 */
export function qualificationValidOn(qualification: Qualification, day: Date): boolean {
    return utcCalendarDay(day) <= qualification.expiresOn
}

/**
 * Whether the agent holds every qualification the shift requires, each of them
 * still valid on the shift's start day.
 *
 * Validity is a property of the shift start only: a qualification expiring on the
 * start day counts, one that expired the day before does not. A shift with no
 * requirement accepts every agent.
 */
export function meetsRequirements(agent: Agent, shift: Shift): boolean {
    const shiftStart = new Date(shift.start)

    return shift.requiredQualifications.every(requiredCode =>
        agent.qualifications.some(qualification => qualification.code === requiredCode && qualificationValidOn(qualification, shiftStart)),
    )
}

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

/**
 * The agents who can work the shift: they meet its requirements and are not already
 * booked on an overlapping window. `headcount` is deliberately ignored, availability
 * is a property of the pair (agent, shift), not of the remaining seats.
 *
 */
export function availableAgents(agents: Agent[], shift: Shift, assignments: Assignment[], shifts: Shift[]): Agent[] {
    return agents.filter(agent => meetsRequirements(agent, shift) && !isDoubleBooked(agent.id, shift, assignments, shifts))
}

/** Unique shift ids referenced by the given assignments, in first-seen order. */
export function uniqueShiftIds(assignments: Assignment[]): string[] {
    return [...new Set(assignments.map(assignment => assignment.shiftId))]
}

function utcCalendarDay(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(date.getUTCDate()).padStart(2, '0')

    return `${year}-${month}-${dayOfMonth}`
}
