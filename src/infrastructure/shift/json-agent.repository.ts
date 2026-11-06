import { Injectable } from '@nestjs/common'
import type { Agent } from '../../domain/shift/models/agent.model'
import type { AgentRepository } from '../../domain/shift/ports'
import { JsonDatabase } from './json-database'

@Injectable()
export class JsonAgentRepository implements AgentRepository {
    constructor(private readonly database: JsonDatabase) {}

    async findByQualificationCodes(codes: string[]): Promise<Agent[]> {
        const { agents } = await this.database.load()

        return agents.filter(agent => agent.qualifications.some(qualification => codes.includes(qualification.code)))
    }
}
