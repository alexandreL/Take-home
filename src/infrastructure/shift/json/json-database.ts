import { readFile, writeFile } from 'node:fs/promises'
import { Injectable } from '@nestjs/common'
import type { Agent } from '../../../domain/shift/models/agent.model'
import type { Assignment } from '../../../domain/shift/models/assignment.model'
import type { Shift } from '../../../domain/shift/models/shift.model'

export interface DatabaseSnapshot {
    agents: Agent[]
    shifts: Shift[]
    assignments: Assignment[]
}

const DEFAULT_DATABASE_PATH = 'database/data.json'

@Injectable()
export class JsonDatabase {
    private snapshot: DatabaseSnapshot | undefined
    private writeQueue: Promise<unknown> = Promise.resolve()

    /** Reads the file once per process, then serves the cached snapshot. */
    async load(): Promise<DatabaseSnapshot> {
        this.snapshot ??= await this.read()

        return this.snapshot
    }

    /**
     * Applies a mutation, rewrites the whole file, then reloads the snapshot from
     * disk so memory can never drift from what is stored.
     *
     * Writes are serialised: two concurrent requests cannot interleave their
     * read-modify-write cycles.
     */
    update<T>(mutate: (snapshot: DatabaseSnapshot) => T): Promise<T> {
        const operation = this.writeQueue.then(async () => {
            const snapshot = await this.load()
            const result = mutate(snapshot)

            await writeFile(this.databasePath, `${JSON.stringify(snapshot, null, 4)}\n`, 'utf8')
            this.snapshot = await this.read()

            return result
        })

        this.writeQueue = operation.then(
            () => undefined,
            () => undefined,
        )

        return operation
    }

    private get databasePath(): string {
        return process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH
    }

    private async read(): Promise<DatabaseSnapshot> {
        const content = await readFile(this.databasePath, 'utf8')

        return JSON.parse(content) as DatabaseSnapshot
    }
}
