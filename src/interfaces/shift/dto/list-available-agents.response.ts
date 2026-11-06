import type { AgentDto } from './agent.dto.js'

/** Response body of `GET /shifts/:shiftId/available-agents`: a bare JSON array (empty, never 404). */
export type ListAvailableAgentsResponse = AgentDto[]
