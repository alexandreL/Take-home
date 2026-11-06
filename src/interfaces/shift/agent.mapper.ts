import type { Agent } from '../../domain/shift/models/agent.model.js'
import type { AgentDto } from './dto/agent.dto.js'

export function toAgentDto(agent: Agent): AgentDto {
    return {
        id: agent.id,
        name: agent.name,
    }
}
