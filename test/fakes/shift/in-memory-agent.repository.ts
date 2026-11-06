import type { Agent } from '../../../src/domain/shift/models/agent.model'
import type { AgentRepository } from '../../../src/domain/shift/ports'

/**
 * In-memory implementation of `AgentRepository`, backed by a fixed list.
 * Used as a test double so the domain stays free of any database.
 */
export class InMemoryAgentRepository implements AgentRepository {
    constructor(private readonly agents: Agent[]) {}

    async findByQualificationCodes(codes: string[]): Promise<Agent[]> {
        return this.agents.filter(agent => agent.qualifications.some(qualification => codes.includes(qualification.code)))
    }
}
