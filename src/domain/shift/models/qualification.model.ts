export interface Qualification {
    /** Opaque qualification code, e.g. `GUARD_LICENSE`. */
    code: string
    /** Last UTC calendar day on which the qualification is valid, as `YYYY-MM-DD`. */
    expiresOn: string
}
