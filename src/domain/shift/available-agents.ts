import { isDoubleBooked } from './is-double-booked.js'
import { meetsRequirements } from './meets-requirements.js'
import type { Agent, Assignment, Shift } from './model.js'

/**
 * The agents who can work the shift: they meet its requirements and are not already
 * booked on an overlapping window. `headcount` is deliberately ignored, availability
 * is a property of the pair (agent, shift), not of the remaining seats.
 *
 */
export function availableAgents(agents: Agent[], shift: Shift, assignments: Assignment[], shifts: Shift[]): Agent[] {
    return agents.filter(agent => meetsRequirements(agent, shift) && !isDoubleBooked(agent.id, shift, assignments, shifts))
}
