/**
 * Data models as they come out of `database/data.json`.
 *
 * Nothing is normalised here: identifiers are opaque strings and instants keep
 * their ISO 8601 representation, exactly as stored. Whoever reads the file is
 * responsible for validating the payload before the domain uses it.
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
