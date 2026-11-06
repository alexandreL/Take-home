import { Injectable } from '@nestjs/common'
import type { AgentRepository } from '../../../application/shift/ports'
import type { Agent } from '../../../domain/shift/models/agent.model'
import { JsonDatabase } from './json-database'

@Injectable()
export class JsonAgentRepository implements AgentRepository {
    constructor(private readonly database: JsonDatabase) {}

    async findById(agentId: string): Promise<Agent | undefined> {
        const { agents } = await this.database.load()

        return agents.find(agent => agent.id === agentId)
    }

    async findByQualificationCodes(codes: string[]): Promise<Agent[]> {
        const { agents } = await this.database.load()

        // A shift with no requirement accepts every agent.
        if (codes.length === 0) {
            return agents
        }

        return agents.filter(agent => agent.qualifications.some(qualification => codes.includes(qualification.code)))
    }
}
