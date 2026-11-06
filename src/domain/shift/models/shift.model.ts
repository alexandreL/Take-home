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
