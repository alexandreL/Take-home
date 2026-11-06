import type { Qualification } from './model.js'

/**
 * Whether the qualification is still valid on the given calendar day.
 *
 * Compared as UTC calendar days: a qualification expires at the end of its
 * `expiresOn` day, so it is valid on that day and invalid the day after.
 */
export function qualificationValidOn(qualification: Qualification, day: Date): boolean {
    return utcCalendarDay(day) <= qualification.expiresOn
}

function utcCalendarDay(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(date.getUTCDate()).padStart(2, '0')

    return `${year}-${month}-${dayOfMonth}`
}
