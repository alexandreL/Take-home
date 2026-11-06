import { Injectable } from '@nestjs/common'
import type { ShiftRepository } from '../../../application/shift/ports'
import type { Shift } from '../../../domain/shift/models/shift.model'
import { SqliteDatabase } from './sqlite-database'

interface ShiftRow {
    id: string
    site: string
    starts_at: string
    ends_at: string
    headcount: number
}

interface RequirementRow {
    shift_id: string
    code: string
}

/** SQLite implementation of `ShiftRepository`. Hand-written SQL, no ORM. */
@Injectable()
export class SqliteShiftRepository implements ShiftRepository {
    constructor(private readonly database: SqliteDatabase) {}

    async findById(shiftId: string): Promise<Shift | undefined> {
        const [shift] = await this.findByIds([shiftId])

        return shift
    }

    async findByIds(shiftIds: string[]): Promise<Shift[]> {
        if (shiftIds.length === 0) {
            return []
        }

        const connection = this.database.connection
        const placeholders = shiftIds.map(() => '?').join(', ')
        const rows = connection
            .prepare(`SELECT id, site, starts_at, ends_at, headcount FROM shifts WHERE id IN (${placeholders})`)
            .all(...shiftIds) as unknown as ShiftRow[]
        const requirements = connection
            .prepare(`SELECT shift_id, code FROM shift_requirements WHERE shift_id IN (${placeholders}) ORDER BY rowid`)
            .all(...shiftIds) as unknown as RequirementRow[]
        const codesByShift = new Map<string, string[]>()

        for (const requirement of requirements) {
            const codes = codesByShift.get(requirement.shift_id) ?? []
            codes.push(requirement.code)
            codesByShift.set(requirement.shift_id, codes)
        }

        return rows.map(row => ({
            id: row.id,
            site: row.site,
            start: row.starts_at,
            end: row.ends_at,
            requiredQualifications: codesByShift.get(row.id) ?? [],
            headcount: row.headcount,
        }))
    }
}
