#!/usr/bin/env node
'use strict'

/*
 * Seeds the SQLite database from a JSON file.
 *
 *   node scripts/seed.js [--source database/data.json] [--database database/data.sqlite] [--reset]
 *
 * Plain JavaScript on purpose: it runs with `node`, without a build step and
 * without a dependency. The schema is the same file the API uses, so the two
 * can never drift.
 */

const { mkdirSync, readFileSync } = require('node:fs')
const { dirname, join } = require('node:path')
const { DatabaseSync } = require('node:sqlite')

const DEFAULT_SOURCE = 'database/data.json'
const SCHEMA_PATH = join(__dirname, '..', 'src', 'infrastructure', 'shift', 'sqlite', 'schema.sql')

const TABLES = ['assignments', 'shift_requirements', 'agent_qualifications', 'shifts', 'agents']

function parseArguments(argv) {
    const options = {
        source: DEFAULT_SOURCE,
        database: process.env.DATABASE_PATH ?? 'database/data.sqlite',
        reset: false,
    }

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index]

        if (argument === '--reset') {
            options.reset = true
        } else if (argument === '--source') {
            options.source = argv[index + 1]
            index += 1
        } else if (argument === '--database') {
            options.database = argv[index + 1]
            index += 1
        } else {
            throw new Error(`unknown argument: ${argument}`)
        }
    }

    return options
}

function readSource(sourcePath) {
    let content

    try {
        content = readFileSync(sourcePath, 'utf8')
    } catch {
        throw new Error(`source file not found: ${sourcePath}`)
    }

    const data = JSON.parse(content)
    for (const key of ['agents', 'shifts', 'assignments']) {
        if (!Array.isArray(data[key])) {
            throw new Error(`invalid source file: ${sourcePath} has no "${key}" array`)
        }
    }

    return data
}

function isEmpty(database) {
    return TABLES.every(table => database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count === 0)
}

function clear(database) {
    for (const table of TABLES) {
        database.prepare(`DELETE FROM ${table}`).run()
    }
}

function seed(options) {
    const data = readSource(options.source)
    mkdirSync(dirname(options.database), { recursive: true })

    const database = new DatabaseSync(options.database)
    database.exec('PRAGMA foreign_keys = ON')
    database.exec(readFileSync(SCHEMA_PATH, 'utf8'))

    try {
        if (!options.reset && !isEmpty(database)) {
            throw new Error(`${options.database} already contains data, use --reset to replace it`)
        }

        database.exec('BEGIN IMMEDIATE')

        try {
            if (options.reset) {
                clear(database)
            }

            const insertAgent = database.prepare('INSERT INTO agents (id, name) VALUES (?, ?)')
            const insertQualification = database.prepare('INSERT INTO agent_qualifications (agent_id, code, expires_on) VALUES (?, ?, ?)')
            const insertShift = database.prepare('INSERT INTO shifts (id, site, starts_at, ends_at, headcount) VALUES (?, ?, ?, ?, ?)')
            const insertRequirement = database.prepare('INSERT INTO shift_requirements (shift_id, code) VALUES (?, ?)')
            const insertAssignment = database.prepare('INSERT INTO assignments (id, shift_id, agent_id) VALUES (?, ?, ?)')

            for (const agent of data.agents) {
                insertAgent.run(agent.id, agent.name)
                for (const qualification of agent.qualifications ?? []) {
                    insertQualification.run(agent.id, qualification.code, qualification.expiresOn)
                }
            }

            for (const shift of data.shifts) {
                insertShift.run(shift.id, shift.site, shift.start, shift.end, shift.headcount)
                for (const code of shift.requiredQualifications ?? []) {
                    insertRequirement.run(shift.id, code)
                }
            }

            for (const assignment of data.assignments) {
                insertAssignment.run(assignment.id, assignment.shiftId, assignment.agentId)
            }

            database.exec('COMMIT')
        } catch (error) {
            database.exec('ROLLBACK')

            throw error
        }
    } finally {
        database.close()
    }

    return {
        agents: data.agents.length,
        shifts: data.shifts.length,
        assignments: data.assignments.length,
    }
}

function main() {
    try {
        const counts = seed(parseArguments(process.argv.slice(2)))
        const plural = counts.assignments === 1 ? 'assignment' : 'assignments'

        console.log(`Seeded ${counts.agents} agents, ${counts.shifts} shifts and ${counts.assignments} ${plural}.`)
    } catch (error) {
        console.error(`seed failed: ${error.message}`)
        process.exitCode = 1
    }
}

if (require.main === module) {
    main()
}

module.exports = { seed, parseArguments }
