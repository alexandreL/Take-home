import { Controller, Get, NotFoundException, Param, UseFilters } from '@nestjs/common'
import { ShiftAvailabilityService } from '../../domain/shift/availability.service.js'
import { toAgentDto } from './agent.mapper.js'
import type { ListAvailableAgentsParams } from './dto/list-available-agents.params.js'
import type { ListAvailableAgentsResponse } from './dto/list-available-agents.response.js'
import { ShiftNotFoundFilter } from './shift-not-found.filter.js'

@Controller('api/shifts')
@UseFilters(ShiftNotFoundFilter)
export class ShiftController {
    constructor(private readonly shiftAvailabilityService: ShiftAvailabilityService) {}

    @Get(':shiftId/available-agents')
    async listAvailableAgents(@Param() params: ListAvailableAgentsParams): Promise<ListAvailableAgentsResponse> {
        const agents = await this.shiftAvailabilityService.listAvailableAgents(params.shiftId)
        if (agents.length === 0) {
            throw new NotFoundException(`No agent is available for shift ${params.shiftId}`)
        }

        return agents.map(toAgentDto)
    }
}
