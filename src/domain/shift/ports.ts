import type { Agent } from './models/agent.model'
import type { Assignment } from './models/assignment.model'
import type { Shift } from './models/shift.model'

/**
 * Read and write ports used by the shift services. Declared in the domain,
 * implemented by the infrastructure (the JSON file today, a real database later).
 *
 * Reads are batched: the services fetch a whole set in one call rather than
 * looping over agents.
 */
export interface ShiftRepository {
    findById(shiftId: string): Promise<Shift | undefined>
    findByIds(shiftIds: string[]): Promise<Shift[]>
}

export interface AgentRepository {
    findById(agentId: string): Promise<Agent | undefined>
    findByQualificationCodes(codes: string[]): Promise<Agent[]>
}

export interface CreateAssignmentInput {
    shiftId: string
    agentId: string
}

export interface AssignmentRepository {
    findByAgentIds(agentIds: string[]): Promise<Assignment[]>
    findByShiftId(shiftId: string): Promise<Assignment[]>
    create(input: CreateAssignmentInput): Promise<Assignment>
}
