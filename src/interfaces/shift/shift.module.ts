import { Module } from '@nestjs/common'
import { ShiftAvailabilityService } from '../../domain/shift/availability.service'
import { JsonAgentRepository } from '../../infrastructure/shift/json-agent.repository'
import { JsonAssignmentRepository } from '../../infrastructure/shift/json-assignment.repository'
import { JsonDatabase } from '../../infrastructure/shift/json-database'
import { JsonShiftRepository } from '../../infrastructure/shift/json-shift.repository'
import { ShiftController } from './shift.controller'

@Module({
    controllers: [ShiftController],
    providers: [
        JsonDatabase,
        JsonShiftRepository,
        JsonAgentRepository,
        JsonAssignmentRepository,
        ShiftAvailabilityService,
    ],
})
export class ShiftModule {}
