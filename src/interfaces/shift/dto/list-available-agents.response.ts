import type { AgentDto } from './agent.dto'

/** Response body of `GET /shifts/:shiftId/available-agents`. */
export interface ListAvailableAgentsResponse {
    agents: AgentDto[]
}
