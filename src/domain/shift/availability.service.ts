import { Inject, Injectable } from '@nestjs/common'
import { JsonAgentRepository } from '../../infrastructure/shift/json-agent.repository'
import { JsonAssignmentRepository } from '../../infrastructure/shift/json-assignment.repository'
import { JsonShiftRepository } from '../../infrastructure/shift/json-shift.repository'
import { availableAgents } from './availability'
import type { Agent } from './models/agent.model'
import type { AgentRepository, AssignmentRepository, ShiftRepository } from './ports'
import { ShiftNotFoundError } from './shift-not-found.error'

/**
 * Lists the agents who can work a given shift.
 *
 * Orchestration only: every business rule already lives in the domain
 * (`availableAgents`). The retrieval order is dictated by the dependencies:
 *
 * 1. the shift, which carries the required qualifications;
 * 2. the candidate agents holding those codes (batched, code filter only — the
 *    date validity stays in the domain);
 * 3. the assignments of those candidates (batched);
 * 4. the shifts referenced by those assignments, so their windows can be compared.
 *
 * Steps 2 and 3 cannot run in parallel: the assignments are looked up by the ids
 * returned by step 2.
 */
@Injectable()
export class ShiftAvailabilityService {
    constructor(
        @Inject(JsonShiftRepository) private readonly shiftRepository: ShiftRepository,
        @Inject(JsonAgentRepository) private readonly agentRepository: AgentRepository,
        @Inject(JsonAssignmentRepository) private readonly assignmentRepository: AssignmentRepository,
    ) {}

    async listAvailableAgents(shiftId: string): Promise<Agent[]> {
        const shift = await this.shiftRepository.findById(shiftId)
        if (shift === undefined) {
            throw new ShiftNotFoundError(shiftId)
        }

        const candidates = await this.agentRepository.findByQualificationCodes(shift.requiredQualifications)
        if (candidates.length === 0) {
            return []
        }

        const assignments = await this.assignmentRepository.findByAgentIds(candidates.map(agent => agent.id))
        const bookedShiftIds = [...new Set(assignments.map(assignment => assignment.shiftId))].filter(id => id !== shift.id)
        const bookedShifts = bookedShiftIds.length === 0 ? [] : await this.shiftRepository.findByIds(bookedShiftIds)

        return availableAgents(candidates, shift, assignments, [shift, ...bookedShifts])
    }
}
