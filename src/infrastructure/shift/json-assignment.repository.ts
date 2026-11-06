import { Injectable } from '@nestjs/common'
import type { Assignment } from '../../domain/shift/models/assignment.model'
import type { AssignmentRepository } from '../../domain/shift/ports'
import { JsonDatabase } from './json-database'

@Injectable()
export class JsonAssignmentRepository implements AssignmentRepository {
    constructor(private readonly database: JsonDatabase) {}

    async findByAgentIds(agentIds: string[]): Promise<Assignment[]> {
        const { assignments } = await this.database.load()

        return assignments.filter(assignment => agentIds.includes(assignment.agentId))
    }
}
