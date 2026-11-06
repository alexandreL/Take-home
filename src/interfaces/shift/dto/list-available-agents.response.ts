import type { AgentDto } from './agent.dto.js'

/** Response body of `GET /shifts/:shiftId/available-agents`. */
export interface ListAvailableAgentsResponse {
    agents: AgentDto[]
}
