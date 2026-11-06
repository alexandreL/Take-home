// biome-ignore-all lint/correctness/noUnusedFunctionParameters lint/correctness/noUnusedPrivateClassMembers: prototype, implemented with its tests
import { Injectable } from '@nestjs/common'
import type { Agent } from '../../domain/shift/availability.js'
import type { AgentRepository, AssignmentRepository, ShiftRepository } from '../../domain/shift/ports.js'

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
        private readonly shiftRepository: ShiftRepository,
        private readonly agentRepository: AgentRepository,
        private readonly assignmentRepository: AssignmentRepository,
    ) {}

    async listAvailableAgents(shiftId: string): Promise<Agent[]> {
        throw new Error('not implemented')
    }
}
