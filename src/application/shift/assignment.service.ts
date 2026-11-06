import { Inject, Injectable } from '@nestjs/common'
import { AgentNotAvailableError } from '../../domain/shift/agent-not-available.error'
import { AgentNotFoundError } from '../../domain/shift/agent-not-found.error'
import { isDoubleBooked, meetsRequirements, uniqueShiftIds } from '../../domain/shift/availability'
import type { Assignment } from '../../domain/shift/models/assignment.model'
import { ShiftFullError } from '../../domain/shift/shift-full.error'
import { ShiftNotFoundError } from '../../domain/shift/shift-not-found.error'
import {
    AGENT_REPOSITORY,
    type AgentRepository,
    ASSIGNMENT_REPOSITORY,
    type AssignmentRepository,
    SHIFT_REPOSITORY,
    type ShiftRepository,
} from './ports'

/**
 * Assigns an agent to a shift.
 *
 * Availability is checked here against the repositories: `meetsRequirements`
 * enforces the qualification rule, `isDoubleBooked` the double-booking rule,
 * using the agent's assignments and the shifts they reference.
 *
 * Checks run in this order: shift exists, agent exists, shift not full, then
 * availability.
 */
@Injectable()
export class AssignmentService {
    constructor(
        @Inject(SHIFT_REPOSITORY) private readonly shiftRepository: ShiftRepository,
        @Inject(AGENT_REPOSITORY) private readonly agentRepository: AgentRepository,
        @Inject(ASSIGNMENT_REPOSITORY) private readonly assignmentRepository: AssignmentRepository,
    ) {}

    async assignAgent(shiftId: string, agentId: string): Promise<Assignment> {
        const shift = await this.shiftRepository.findById(shiftId)
        if (shift === undefined) {
            throw new ShiftNotFoundError(shiftId)
        }

        const agent = await this.agentRepository.findById(agentId)
        if (agent === undefined) {
            throw new AgentNotFoundError(agentId)
        }

        const shiftAssignments = await this.assignmentRepository.findByShiftId(shiftId)
        if (shiftAssignments.length >= shift.headcount) {
            throw new ShiftFullError(shiftId)
        }

        if (!meetsRequirements(agent, shift)) {
            throw new AgentNotAvailableError(shiftId, agentId, 'qualification')
        }

        const assignments = await this.assignmentRepository.findByAgentIds([agentId])
        const bookedShifts = await this.shiftRepository.findByIds(uniqueShiftIds(assignments))
        if (isDoubleBooked(agentId, shift, assignments, bookedShifts)) {
            throw new AgentNotAvailableError(shiftId, agentId, 'double-booked')
        }

        // The check above answers 409 before the availability rules; this call is
        // what actually enforces the limit, atomically.
        const assignment = await this.assignmentRepository.create({ shiftId, agentId }, shift.headcount)
        if (assignment === undefined) {
            throw new ShiftFullError(shiftId)
        }

        return assignment
    }
}
