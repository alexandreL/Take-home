import { Inject, Injectable } from '@nestjs/common'
import { JsonAgentRepository } from '../../infrastructure/shift/json-agent.repository'
import { JsonAssignmentRepository } from '../../infrastructure/shift/json-assignment.repository'
import { JsonShiftRepository } from '../../infrastructure/shift/json-shift.repository'
import { AgentNotAvailableError } from './agent-not-available.error'
import { AgentNotFoundError } from './agent-not-found.error'
import { isDoubleBooked, meetsRequirements, uniqueShiftIds } from './availability'
import type { Assignment } from './models/assignment.model'
import type { AgentRepository, AssignmentRepository, ShiftRepository } from './ports'
import { ShiftFullError } from './shift-full.error'
import { ShiftNotFoundError } from './shift-not-found.error'

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
        @Inject(JsonShiftRepository) private readonly shiftRepository: ShiftRepository,
        @Inject(JsonAgentRepository) private readonly agentRepository: AgentRepository,
        @Inject(JsonAssignmentRepository) private readonly assignmentRepository: AssignmentRepository,
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

        return this.assignmentRepository.create({ shiftId, agentId })
    }
}
