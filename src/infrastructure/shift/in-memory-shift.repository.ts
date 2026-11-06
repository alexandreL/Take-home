import type { Shift } from '../../domain/shift/models/shift.model'
import type { ShiftRepository } from '../../domain/shift/ports'

/**
 * In-memory implementation of `ShiftRepository`, backed by a fixed list.
 * Used as a test double so the domain stays free of any database.
 */
export class InMemoryShiftRepository implements ShiftRepository {
    constructor(private readonly shifts: Shift[]) {}

    async findById(shiftId: string): Promise<Shift | undefined> {
        return this.shifts.find(shift => shift.id === shiftId)
    }

    async findByIds(shiftIds: string[]): Promise<Shift[]> {
        return this.shifts.filter(shift => shiftIds.includes(shift.id))
    }
}
