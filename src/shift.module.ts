import { Module } from '@nestjs/common'
import { AssignmentService } from './application/shift/assignment.service'
import { ShiftAvailabilityService } from './application/shift/availability.service'
import { AGENT_REPOSITORY, ASSIGNMENT_REPOSITORY, SHIFT_REPOSITORY } from './application/shift/ports'
import { SqliteAgentRepository } from './infrastructure/shift/sqlite/sqlite-agent.repository'
import { SqliteAssignmentRepository } from './infrastructure/shift/sqlite/sqlite-assignment.repository'
import { SqliteDatabase } from './infrastructure/shift/sqlite/sqlite-database'
import { SqliteShiftRepository } from './infrastructure/shift/sqlite/sqlite-shift.repository'
import { ShiftController } from './interfaces/shift/shift.controller'

@Module({
    controllers: [ShiftController],
    providers: [
        SqliteDatabase,
        // This module is the only place where the ports are bound to adapters.
        { provide: SHIFT_REPOSITORY, useClass: SqliteShiftRepository },
        { provide: AGENT_REPOSITORY, useClass: SqliteAgentRepository },
        { provide: ASSIGNMENT_REPOSITORY, useClass: SqliteAssignmentRepository },
        ShiftAvailabilityService,
        AssignmentService,
    ],
})
export class ShiftModule {}
