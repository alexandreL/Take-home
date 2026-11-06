import type { Assignment } from '../../domain/shift/models/assignment.model'
import type { AssignmentDto } from './dto/assignment.dto'

export function toAssignmentDto(assignment: Assignment): AssignmentDto {
    return {
        id: assignment.id,
        shiftId: assignment.shiftId,
        agentId: assignment.agentId,
    }
}
