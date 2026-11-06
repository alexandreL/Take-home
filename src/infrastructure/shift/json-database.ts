import { readFile } from 'node:fs/promises'
import { Injectable } from '@nestjs/common'
import type { Agent } from '../../domain/shift/models/agent.model.js'
import type { Assignment } from '../../domain/shift/models/assignment.model.js'
import type { Shift } from '../../domain/shift/models/shift.model.js'

export interface DatabaseSnapshot {
    agents: Agent[]
    shifts: Shift[]
    assignments: Assignment[]
}

const DEFAULT_DATABASE_PATH = 'database/data.json'

@Injectable()
export class JsonDatabase {
    private snapshot: Promise<DatabaseSnapshot> | undefined

    /** Reads the file once per process: the JSON document is the whole database. */
    load(): Promise<DatabaseSnapshot> {
        this.snapshot ??= readFile(process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH, 'utf8').then(
            content => JSON.parse(content) as DatabaseSnapshot,
        )

        return this.snapshot
    }
}
