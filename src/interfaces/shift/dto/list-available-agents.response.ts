import type { AgentDto } from './agent.dto.js'

/**
 * Response body of `GET /shifts/:shiftId/available-agents`.
 *
 * Never empty: the endpoint answers 404 when no agent is available.
 */
export type ListAvailableAgentsResponse = AgentDto[]
