export class AgentNotFoundError extends Error {
    readonly agentId: string

    constructor(agentId: string) {
        super(`Agent ${agentId} not found`)
        this.name = 'AgentNotFoundError'
        this.agentId = agentId
    }
}
