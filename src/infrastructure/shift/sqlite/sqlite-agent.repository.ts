import { Injectable } from '@nestjs/common'
import type { Agent } from '../../../domain/shift/models/agent.model'
import type { AgentRepository } from '../../../domain/shift/ports'
import { SqliteDatabase } from './sqlite-database'

interface AgentRow {
    id: string
    name: string
}

interface QualificationRow {
    agent_id: string
    code: string
    expires_on: string
}

/** SQLite implementation of `AgentRepository`. Hand-written SQL, no ORM. */
@Injectable()
export class SqliteAgentRepository implements AgentRepository {
    constructor(private readonly database: SqliteDatabase) {}

    async findById(agentId: string): Promise<Agent | undefined> {
        const row = this.database.connection.prepare('SELECT id, name FROM agents WHERE id = ?').get(agentId) as unknown as
            | AgentRow
            | undefined

        if (row === undefined) {
            return undefined
        }

        const [agent] = this.hydrate([row])

        return agent
    }

    async findByQualificationCodes(codes: string[]): Promise<Agent[]> {
        const connection = this.database.connection

        // A shift with no requirement accepts every agent.
        if (codes.length === 0) {
            const rows = connection.prepare('SELECT id, name FROM agents ORDER BY rowid').all() as unknown as AgentRow[]

            return this.hydrate(rows)
        }

        const rows = connection
            .prepare(
                `SELECT DISTINCT agents.id, agents.name
                 FROM agents
                 JOIN agent_qualifications ON agent_qualifications.agent_id = agents.id
                 WHERE agent_qualifications.code IN (${codes.map(() => '?').join(', ')})
                 ORDER BY agents.rowid`,
            )
            .all(...codes) as unknown as AgentRow[]

        return this.hydrate(rows)
    }

    /** Loads the qualifications of every agent in one query, then assembles the models. */
    private hydrate(rows: AgentRow[]): Agent[] {
        if (rows.length === 0) {
            return []
        }

        const agentIds = rows.map(row => row.id)
        const qualifications = this.database.connection
            .prepare(
                `SELECT agent_id, code, expires_on FROM agent_qualifications
                 WHERE agent_id IN (${agentIds.map(() => '?').join(', ')})
                 ORDER BY rowid`,
            )
            .all(...agentIds) as unknown as QualificationRow[]
        const byAgent = new Map<string, Agent['qualifications']>()

        for (const qualification of qualifications) {
            const held = byAgent.get(qualification.agent_id) ?? []
            held.push({ code: qualification.code, expiresOn: qualification.expires_on })
            byAgent.set(qualification.agent_id, held)
        }

        return rows.map(row => ({ id: row.id, name: row.name, qualifications: byAgent.get(row.id) ?? [] }))
    }
}
