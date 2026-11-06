import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { Injectable, Optional } from '@nestjs/common'

export const DEFAULT_DATABASE_PATH = 'database/data.sqlite'

const SCHEMA_PATH = join(__dirname, 'schema.sql')

/**
 * Owns the SQLite connection and the schema.
 *
 * No ORM: the repositories below it write their SQL by hand. The connection is
 * opened lazily, on first use, so importing this class never touches the disk.
 */
@Injectable()
export class SqliteDatabase {
    private instance: DatabaseSync | undefined

    constructor(@Optional() readonly databasePath: string = process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH) {}

    get connection(): DatabaseSync {
        this.instance ??= this.open()

        return this.instance
    }

    close(): void {
        this.instance?.close()
        this.instance = undefined
    }

    private open(): DatabaseSync {
        if (this.databasePath !== ':memory:') {
            mkdirSync(dirname(this.databasePath), { recursive: true })
        }

        const connection = new DatabaseSync(this.databasePath)
        connection.exec('PRAGMA foreign_keys = ON')
        // Another process writing at the same time makes SQLite wait instead of
        // failing immediately; the booking transaction then sees the committed rows.
        connection.exec('PRAGMA busy_timeout = 5000')
        connection.exec(readFileSync(SCHEMA_PATH, 'utf8'))

        return connection
    }
}
