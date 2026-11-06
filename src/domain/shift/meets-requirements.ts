import type { Agent, Shift } from './model.js'
import { qualificationValidOn } from './qualification.js'

const ONE_MILLISECOND = 1

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
