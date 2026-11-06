import { Module } from '@nestjs/common'
import { ShiftAvailabilityService } from '../../domain/shift/availability.service.js'
import { JsonAgentRepository } from '../../infrastructure/shift/json-agent.repository.js'
import { JsonAssignmentRepository } from '../../infrastructure/shift/json-assignment.repository.js'
import { JsonDatabase } from '../../infrastructure/shift/json-database.js'
import { JsonShiftRepository } from '../../infrastructure/shift/json-shift.repository.js'
import { ShiftController } from './shift.controller.js'

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
