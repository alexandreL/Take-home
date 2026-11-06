/**
 * Availability of an agent for a shift.
 *
 * The data models mirror `database/data.json`: identifiers are opaque strings and
 * instants keep their ISO 8601 representation, exactly as stored. Nothing is
 * normalised here; whoever reads the file validates the payload first.
 */

export interface Qualification {
    /** Opaque qualification code, e.g. `GUARD_LICENSE`. */
    code: string
    /** Last UTC calendar day on which the qualification is valid, as `YYYY-MM-DD`. */
    expiresOn: string
}

export interface Agent {
    id: string
    name: string
    qualifications: Qualification[]
}

export interface Shift {
    id: string
    site: string
    /** ISO 8601 instant with a UTC offset, e.g. `2026-09-15T22:00:00Z`. */
    start: string
    /** ISO 8601 instant with a UTC offset, strictly after `start`. */
    end: string
    /** Every qualification code an agent must hold to work this shift. */
    requiredQualifications: string[]
    /** Number of agents the shift needs. */
    headcount: number
}

export interface Assignment {
    id: string
    shiftId: string
    agentId: string
}

const ONE_MILLISECOND = 1

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
 * still valid at the end of the shift.
 *
 * A shift is inclusive of its end instant, but a qualification only covers whole
 * UTC calendar days. Stepping back by the smallest representable unit keeps the
 * two on the same footing: a qualification expiring exactly at `end` still counts.
 *
 * A shift with no requirement accepts every agent.
 */
export function meetsRequirements(agent: Agent, shift: Shift): boolean {
    const lastInstantOfWork = new Date(Date.parse(shift.end) - ONE_MILLISECOND)

    return shift.requiredQualifications.every(requiredCode =>
        agent.qualifications.some(
            qualification => qualification.code === requiredCode && qualificationValidOn(qualification, lastInstantOfWork),
        ),
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

function utcCalendarDay(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(date.getUTCDate()).padStart(2, '0')

    return `${year}-${month}-${dayOfMonth}`
}
