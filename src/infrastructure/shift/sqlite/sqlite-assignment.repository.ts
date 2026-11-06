import { Injectable } from '@nestjs/common'
import type { Assignment } from '../../../domain/shift/models/assignment.model'
import type { AssignmentRepository, CreateAssignmentInput } from '../../../domain/shift/ports'
import { SqliteDatabase } from './sqlite-database'

interface AssignmentRow {
    id: string
    shift_id: string
    agent_id: string
}

/** SQLite implementation of `AssignmentRepository`. Hand-written SQL, no ORM. */
@Injectable()
export class SqliteAssignmentRepository implements AssignmentRepository {
    constructor(private readonly database: SqliteDatabase) {}

    async findByAgentIds(agentIds: string[]): Promise<Assignment[]> {
        if (agentIds.length === 0) {
            return []
        }

        const rows = this.database.connection
            .prepare(
                `SELECT id, shift_id, agent_id FROM assignments
                 WHERE agent_id IN (${agentIds.map(() => '?').join(', ')})
                 ORDER BY rowid`,
            )
            .all(...agentIds) as unknown as AssignmentRow[]

        return rows.map(toAssignment)
    }

    async findByShiftId(shiftId: string): Promise<Assignment[]> {
        const rows = this.database.connection
            .prepare('SELECT id, shift_id, agent_id FROM assignments WHERE shift_id = ? ORDER BY rowid')
            .all(shiftId) as unknown as AssignmentRow[]

        return rows.map(toAssignment)
    }

    async create(input: CreateAssignmentInput): Promise<Assignment> {
        const connection = this.database.connection

        // The read of the current highest id and the insert must not interleave
        // with another booking.
        connection.exec('BEGIN IMMEDIATE')

        try {
            const row = connection.prepare('SELECT COALESCE(MAX(CAST(SUBSTR(id, 5) AS INTEGER)), 0) AS highest FROM assignments').get() as {
                highest: number
            }
            const assignment: Assignment = { id: `asg_${row.highest + 1}`, shiftId: input.shiftId, agentId: input.agentId }

            connection
                .prepare('INSERT INTO assignments (id, shift_id, agent_id) VALUES (?, ?, ?)')
                .run(assignment.id, assignment.shiftId, assignment.agentId)
            connection.exec('COMMIT')

            return assignment
        } catch (error) {
            connection.exec('ROLLBACK')

            throw error
        }
    }
}

function toAssignment(row: AssignmentRow): Assignment {
    return { id: row.id, shiftId: row.shift_id, agentId: row.agent_id }
}
