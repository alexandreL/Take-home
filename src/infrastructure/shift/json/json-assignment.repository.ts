import { Injectable } from '@nestjs/common'
import type { AssignmentRepository, CreateAssignmentInput } from '../../../application/shift/ports'
import type { Assignment } from '../../../domain/shift/models/assignment.model'
import { JsonDatabase } from './json-database'

@Injectable()
export class JsonAssignmentRepository implements AssignmentRepository {
    constructor(private readonly database: JsonDatabase) {}

    async findByAgentIds(agentIds: string[]): Promise<Assignment[]> {
        const { assignments } = await this.database.load()

        return assignments.filter(assignment => agentIds.includes(assignment.agentId))
    }

    async findByShiftId(shiftId: string): Promise<Assignment[]> {
        const { assignments } = await this.database.load()

        return assignments.filter(assignment => assignment.shiftId === shiftId)
    }

    async create(input: CreateAssignmentInput, capacity: number): Promise<Assignment | undefined> {
        return this.database.update(snapshot => {
            const used = snapshot.assignments.filter(assignment => assignment.shiftId === input.shiftId).length
            if (used >= capacity) {
                return undefined
            }

            const assignment: Assignment = {
                id: nextAssignmentId(snapshot.assignments),
                shiftId: input.shiftId,
                agentId: input.agentId,
            }
            snapshot.assignments.push(assignment)

            return assignment
        })
    }
}

function nextAssignmentId(assignments: Assignment[]): string {
    const highest = assignments.reduce((max, assignment) => {
        const suffix = Number.parseInt(assignment.id.replace('asg_', ''), 10)

        return Number.isNaN(suffix) ? max : Math.max(max, suffix)
    }, 0)

    return `asg_${highest + 1}`
}
