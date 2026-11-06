# AGENTS.md

Working rules for this repository. Read this before changing code.

## Project

A backend service built with NestJS and TypeScript, following a hexagonal architecture.

All code, comments, tests and documentation are written in English.

## Stack

- Runtime: Node.js >= 22.5 (built-in `node:sqlite`)
- Framework: NestJS 12 (ESM)
- Language: TypeScript, `strict` mode
- Package manager: pnpm
- Tests: Vitest + Supertest
- Lint and formatting: Biome

## Commands

| Command                 | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `pnpm build`            | Compile to `dist/`                       |
| `pnpm test`             | Run unit tests                           |
| `pnpm test:cov`         | Run unit tests with coverage             |
| `pnpm check`            | Lint, formatting and import order checks |
| `pnpm check:fix`        | Apply safe Biome fixes                   |
| `pnpm check:fix:unsafe` | Apply safe and unsafe Biome fixes        |
| `pnpm format`           | Format only                              |
| `pnpm seed`             | Load `database/data.json` into SQLite    |
| `pnpm seed:reset`       | Empty the SQLite database, then load it  |

## Git hooks

Husky is installed by `pnpm install` through the `prepare` script. The pre-commit hook
runs, in order:

1. `pnpm check`
2. `pnpm build`
3. `pnpm test`
4. `pnpm test:e2e`

Never bypass it with `--no-verify`. Fix the failure instead.

## Architecture

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

Dependency direction:

```
interfaces ──▶ application ──▶ domain ◀── infrastructure
```

- `application` depends on `domain`. It may use `@Injectable()` from Nest for
  dependency injection, nothing more.
- `infrastructure` depends on `domain` (to implement its ports) and may use any
  driver or library it needs.
- `interfaces` depends on `application` and `domain` types. It never talks to a
  repository or a driver directly.
- `app.module.ts` is the only place where ports are bound to adapters.

### Layer responsibilities

| Layer            | Owns                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| `domain`         | Business rules, invariants, entities, value objects, typed errors, port interfaces. |
| `application`    | One use case per class. Orchestrates domain objects through ports. No HTTP, no SQL. |
| `infrastructure` | Concrete adapters: persistence, external APIs, clocks, message brokers.             |
| `interfaces`     | Controllers, request/response DTOs, mapping, HTTP-specific error handling.          |

### Rules

- Business logic never lives in a controller, a DTO or a repository adapter.
- A controller only parses input, calls exactly one use case, and maps the result.
- Ports are declared where they are consumed. A repository interface belongs to
  `domain`; an external service gateway interface also belongs to `domain`.
- Adapters are named after their technology: `InMemoryTaskRepository`,
  `PostgresTaskRepository`, `StripePaymentGateway`.
- Never throw `HttpException` from `domain` or `application`. Throw a typed domain
  or application error and translate it at the `interfaces` boundary.
- No `any`. No non-null assertion (`!`) unless the reason is obvious and commented.
- No barrel (`index.ts`) files. Import from the concrete file.
- Do not add a dependency, a layer or an abstraction before a real need exists.
- No commented-out code and no dead code in a commit.

## Test-driven development

Every change to behaviour follows red → green → refactor:

1. **Red** — write one small failing test that expresses the expected behaviour.
2. **Green** — write the minimum production code that makes it pass.
3. **Refactor** — clean up while the test stays green.

Never write production code that is not required by a failing test.

### Test placement

- Unit tests live next to the code they cover, as `<file>.spec.ts`.
- End-to-end tests live in `test/` as `<feature>.e2e-spec.ts` and drive the app
  through Supertest.
- Test names describe behaviour: `should reject a task with an empty title`.
- Prefer fakes over mocks. A fake in-memory adapter is usually enough.
- Do not test private methods or framework internals.
- A bug fix starts with a test that reproduces the bug.

## Naming

- Files and directories: `kebab-case`.
- Classes and types: `PascalCase`. One exported class per file.
- Ports: `<Thing>Repository`, `<Thing>Gateway`, `<Thing>Clock`.
- Use cases: `<Verb><Thing>UseCase`, with `<Verb><Thing>Command` as input and
  `<Verb><Thing>Result` as output.
- Domain errors: `<Thing>Error`.

## Interaction log

Reviewers read the log to understand how the work was decided, not only what the code
does. After every user request:

1. Copy the user's message **verbatim**, in its original language and wording. Never
   paraphrase, translate, correct or summarise it.
2. Add a very short summary (one to three lines) of what was done in response.
3. Append the entry to `logs/YYYY-MM-DD.md`, in chronological order, under a
   `### <n>. <YYYY-MM-DD HH:mm> — <short title>` heading. Create `logs/` and the file
   if needed. The timestamp is the local time at which the request arrived, to the
   minute, taken from the system clock — never estimated or derived from file times.
4. If a request was not timestamped when it arrived, write `time not recorded` instead
   of inventing one.
5. Use a fenced `text` block for the verbatim message so formatting never alters it.
6. Commit the log together with the change it describes.

Log files are documentation: they must be committed and are never gitignored.

## Definition of done

A task is complete only when:

- `pnpm check` passes;
- `pnpm test` and `pnpm test:e2e` pass;
- `pnpm build` passes;
- the change contains tests for the behaviour it introduces;
- the README or this file is updated when commands, structure or rules change.
