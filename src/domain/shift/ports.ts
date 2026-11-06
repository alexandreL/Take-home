import type { Agent } from './models/agent.model.js'
import type { Assignment } from './models/assignment.model.js'
import type { Shift } from './models/shift.model.js'

/**
 * Read ports used by the availability service. Declared in the domain, implemented
 * by the infrastructure (the JSON file today, a real database later).
 *
 * All reads are batched: the service fetches a whole set in one call rather than
 * looping over agents.
 */
export interface ShiftRepository {
    findById(shiftId: string): Promise<Shift | undefined>
    findByIds(shiftIds: string[]): Promise<Shift[]>
}

export interface AgentRepository {
    findByQualificationCodes(codes: string[]): Promise<Agent[]>
}

export interface AssignmentRepository {
    findByAgentIds(agentIds: string[]): Promise<Assignment[]>
}
