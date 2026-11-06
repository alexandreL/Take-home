import { Body, Controller, Get, Param, Post, UseFilters } from '@nestjs/common'
import { AssignmentService } from '../../application/shift/assignment.service'
import { ShiftAvailabilityService } from '../../application/shift/availability.service'
import { toAgentDto } from './agent.mapper'
import { toAssignmentDto } from './assignment.mapper'
import type { CreateAssignmentBody } from './dto/create-assignment.body'
import type { CreateAssignmentParams } from './dto/create-assignment.params'
import type { CreateAssignmentResponse } from './dto/create-assignment.response'
import type { ListAvailableAgentsParams } from './dto/list-available-agents.params'
import type { ListAvailableAgentsResponse } from './dto/list-available-agents.response'
import { ShiftErrorFilter } from './shift-error.filter'

@Controller('api/shifts')
@UseFilters(ShiftErrorFilter)
export class ShiftController {
    constructor(
        private readonly shiftAvailabilityService: ShiftAvailabilityService,
        private readonly assignmentService: AssignmentService,
    ) {}

    @Get(':shiftId/available-agents')
    async listAvailableAgents(@Param() params: ListAvailableAgentsParams): Promise<ListAvailableAgentsResponse> {
        const agents = await this.shiftAvailabilityService.listAvailableAgents(params.shiftId)

        return agents.map(toAgentDto)
    }

    @Post(':shiftId/assignments')
    async createAssignment(@Param() params: CreateAssignmentParams, @Body() body: CreateAssignmentBody): Promise<CreateAssignmentResponse> {
        const assignment = await this.assignmentService.assignAgent(params.shiftId, body.agentId)

        return toAssignmentDto(assignment)
    }
}
