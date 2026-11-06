import type { AgentRepository } from '../../../application/shift/ports'
import type { Agent } from '../../../domain/shift/models/agent.model'

/**
 * In-memory implementation of `AgentRepository`, backed by a fixed list.
 * Used as a test double so the domain stays free of any database.
 */
export class InMemoryAgentRepository implements AgentRepository {
    constructor(private readonly agents: Agent[]) {}

    async findById(agentId: string): Promise<Agent | undefined> {
        return this.agents.find(agent => agent.id === agentId)
    }

    async findByQualificationCodes(codes: string[]): Promise<Agent[]> {
        if (codes.length === 0) {
            return this.agents
        }

        return this.agents.filter(agent => agent.qualifications.some(qualification => codes.includes(qualification.code)))
    }
}
