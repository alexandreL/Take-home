import type { Assignment } from '../../domain/shift/models/assignment.model'
import type { AssignmentRepository } from '../../domain/shift/ports'

/**
 * In-memory implementation of `AssignmentRepository`, backed by a fixed list.
 * Used as a test double so the domain stays free of any database.
 */
export class InMemoryAssignmentRepository implements AssignmentRepository {
    constructor(private readonly assignments: Assignment[]) {}

    async findByAgentIds(agentIds: string[]): Promise<Assignment[]> {
        return this.assignments.filter(assignment => agentIds.includes(assignment.agentId))
    }
}
