-- Schema of the shift database.
--
-- The domain models carry two lists (`agent.qualifications` and
-- `shift.requiredQualifications`). They are stored in their own tables rather
-- than in a JSON column: a JSON column would only move the flat file inside the
-- database.
--
-- Instant columns hold the ISO 8601 strings of the domain models verbatim, so
-- the domain never has to parse or reformat a date.

CREATE TABLE IF NOT EXISTS agents (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_qualifications (
    agent_id   TEXT NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
    code       TEXT NOT NULL,
    expires_on TEXT NOT NULL,
    PRIMARY KEY (agent_id, code)
);

CREATE TABLE IF NOT EXISTS shifts (
    id         TEXT PRIMARY KEY,
    site       TEXT NOT NULL,
    starts_at  TEXT NOT NULL,
    ends_at    TEXT NOT NULL,
    headcount  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shift_requirements (
    shift_id TEXT NOT NULL REFERENCES shifts (id) ON DELETE CASCADE,
    code     TEXT NOT NULL,
    PRIMARY KEY (shift_id, code)
);

CREATE TABLE IF NOT EXISTS assignments (
    id       TEXT PRIMARY KEY,
    shift_id TEXT NOT NULL REFERENCES shifts (id),
    agent_id TEXT NOT NULL REFERENCES agents (id)
);

CREATE INDEX IF NOT EXISTS assignments_by_shift ON assignments (shift_id);
CREATE INDEX IF NOT EXISTS assignments_by_agent ON assignments (agent_id);
