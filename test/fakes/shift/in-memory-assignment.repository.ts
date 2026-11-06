import type { Assignment } from '../../../src/domain/shift/models/assignment.model'
import type { AssignmentRepository, CreateAssignmentInput } from '../../../src/domain/shift/ports'

/**
 * In-memory implementation of `AssignmentRepository`, backed by a fixed list.
 * Used as a test double so the domain stays free of any database.
 */
export class InMemoryAssignmentRepository implements AssignmentRepository {
    readonly created: CreateAssignmentInput[] = []

    constructor(private readonly assignments: Assignment[] = []) {}

    async findByAgentIds(agentIds: string[]): Promise<Assignment[]> {
        return this.assignments.filter(assignment => agentIds.includes(assignment.agentId))
    }

    async findByShiftId(shiftId: string): Promise<Assignment[]> {
        return this.assignments.filter(assignment => assignment.shiftId === shiftId)
    }

    async create(input: CreateAssignmentInput): Promise<Assignment> {
        this.created.push(input)
        const assignment: Assignment = { id: `asg_${this.assignments.length + 1}`, ...input }
        this.assignments.push(assignment)

        return assignment
    }
}
