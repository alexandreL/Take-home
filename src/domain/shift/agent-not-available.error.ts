export class AgentNotAvailableError extends Error {
    readonly shiftId: string
    readonly agentId: string
    readonly reason: 'qualification' | 'double-booked'

    constructor(shiftId: string, agentId: string, reason: 'qualification' | 'double-booked') {
        super(`Agent ${agentId} is not available for shift ${shiftId} (${reason})`)
        this.name = 'AgentNotAvailableError'
        this.shiftId = shiftId
        this.agentId = agentId
        this.reason = reason
    }
}
