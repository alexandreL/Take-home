# Take-Home

A NestJS backend skeleton with a deliberately simple hexagonal architecture.

## Requirements

- Node.js >= 22.5 (the API uses the built-in `node:sqlite` module)
- pnpm

## Getting started

```bash
pnpm install
pnpm seed
pnpm start:dev
```

`pnpm seed` creates `database/data.sqlite` from `database/data.json`. The server
listens on `http://localhost:3000` by default. Override it with `PORT`.

## Commands

| Command           | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `pnpm start:dev`  | Run with watch mode                      |
| `pnpm build`      | Compile to `dist/`                       |
| `pnpm start:prod` | Run the compiled app                     |
| `pnpm test`       | Run unit tests                           |
| `pnpm test:watch` | Run unit tests in watch mode             |
| `pnpm test:e2e`   | Run end-to-end tests                     |
| `pnpm test:cov`   | Run unit tests with coverage             |
| `pnpm check`      | Lint, formatting and import order checks |
| `pnpm check:fix`  | Apply safe Biome fixes                   |
| `pnpm format`     | Format only                              |
| `pnpm seed`       | Fill SQLite from `database/data.json`    |
| `pnpm seed:reset` | Empty the database, then fill it again   |

## Structure

```
src/
  domain/          # entities, value objects, domain errors, ports
  application/     # use cases, commands and results
  infrastructure/  # adapters implementing the ports
  interfaces/      # driving adapters: HTTP controllers, DTOs, mappers
  app.module.ts    # composition root (wiring only)
  main.ts          # bootstrap
test/              # end-to-end tests
```

Dependencies point inward:

```
interfaces ──▶ application ──▶ domain ◀── infrastructure
```

The domain is plain TypeScript with no framework dependency. Ports are declared
where they are consumed and implemented in `infrastructure`. The Nest module is
the only place where an implementation is bound to a port.

## Database

The storage is a SQLite file (`database/data.sqlite`), accessed through the
built-in `node:sqlite` module with hand-written SQL: there is no ORM.

`database/data.json` is only a seed: `pnpm seed` loads it into an empty database
and refuses to run when the database already holds data, unless `--reset` is
passed. Once seeded, the JSON file is never written again.

The adapters live in `src/infrastructure/shift/`:

- `sqlite/` is the active implementation;
- `json/` is the previous one, kept for reference and no longer wired.

Point `DATABASE_PATH` at another file to use a different database.

- **Biome** handles both linting and formatting.
- **Vitest** runs unit tests; **Supertest** drives the end-to-end tests.

## Git hooks

Husky is installed automatically by `pnpm install`. Every commit runs the checks in
`.husky/pre-commit`: lint/format (`pnpm check`), build, unit tests and end-to-end tests.
A commit is blocked as soon as one of them fails.

## Development workflow

The project follows test-driven development. See [AGENTS.md](./AGENTS.md) for the
full set of architecture, naming and testing rules.
