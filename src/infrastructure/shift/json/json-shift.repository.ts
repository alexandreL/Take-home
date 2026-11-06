import { Injectable } from '@nestjs/common'
import type { ShiftRepository } from '../../../application/shift/ports'
import type { Shift } from '../../../domain/shift/models/shift.model'
import { JsonDatabase } from './json-database'

@Injectable()
export class JsonShiftRepository implements ShiftRepository {
    constructor(private readonly database: JsonDatabase) {}

    async findById(shiftId: string): Promise<Shift | undefined> {
        const { shifts } = await this.database.load()

        return shifts.find(shift => shift.id === shiftId)
    }

    async findByIds(shiftIds: string[]): Promise<Shift[]> {
        const { shifts } = await this.database.load()

        return shifts.filter(shift => shiftIds.includes(shift.id))
    }
}
