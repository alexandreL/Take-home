import type { Agent } from '../../domain/shift/models/agent.model'
import type { AgentDto } from './dto/agent.dto'

export function toAgentDto(agent: Agent): AgentDto {
    return {
        id: agent.id,
        name: agent.name,
    }
}
