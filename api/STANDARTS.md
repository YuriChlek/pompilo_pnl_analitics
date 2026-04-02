# API Standards

## Purpose

This document defines the required naming and structural conventions for the NestJS `api` application.

The goal is consistency:

- modules look the same
- contracts live in predictable places
- integration code is separated from domain code
- renames and refactors remain low-risk

## Naming Rules

### General

- Use `kebab-case` for folders.
- Use `kebab-case` for file names unless Nest requires a suffix-oriented class file pattern.
- Use `PascalCase` for classes, DTOs, entities, services, controllers, guards, and modules.
- Use `camelCase` for functions and variables.

### Required file suffixes

- Module: `*.module.ts`
- Service: `*.service.ts`
- Controller: `*.controller.ts`
- Guard: `*.guard.ts`
- Strategy: `*.strategy.ts`
- DTO: `*.dto.ts`
- Entity: `*.entity.ts`
- Interface contract: `*.interfaces.ts`
- Enum: `*.enums.ts`
- Config factory: `*.config.ts`
- Pure util: descriptive kebab-case, for example `setup-swagger.util.ts`

## Module Structure

Each backend domain module should follow this shape when applicable:

```text
module-foo/
├── dto/
├── entities/
├── enums/
├── interfaces/
├── services/
├── guards/
├── strategies/
├── constants/
├── types/
├── module-foo.controller.ts
└── module-foo.module.ts
```

Not every module needs every folder, but new code should follow this shape when the concern exists.

## What Goes Where

### `dto/`

Use `dto/` only for transport-layer request and response DTOs.

Rules:

- validate incoming data here
- do not place business logic here

### `entities/`

Use `entities/` only for persistence models.

Rules:

- TypeORM entities stay here
- do not mix repository logic into entity files

### `interfaces/`

Use `interfaces/` for stable contracts:

- integration response shapes
- auth/token payload contracts
- service-facing structural contracts

### `types/`

Use `types/` for helper types, raw query result shapes, mapped types, and technical type aliases.

### `enums/`

Use `enums/` only for enums.

### `services/`

Use `services/` for business logic and infrastructure coordination.

Rules:

- one primary responsibility per service
- repository access should be isolated where possible
- external API integration should not be mixed with controller logic

### `constants/`

Use `constants/` for stable domain constants and module-level config values.

### `config/`

Use `config/` for Nest config factories and infra setup.

Examples:

- TypeORM config
- JWT config
- BullMQ config

### `common/`

Use `common/` only for cross-module shared infrastructure:

- interceptors
- shared DTO wrappers
- generic utilities

Do not put domain-specific logic into `common/`.

## Architectural Boundaries

### Controllers

Controllers should:

- receive request data
- delegate to services
- not contain business rules
- not contain query-building logic

### Services

Services should:

- own business decisions
- orchestrate repositories, tokens, encryption, queues, and integrations
- throw meaningful HTTP exceptions only at clear boundaries

### Repository-style services

If a service is effectively a repository wrapper, keep it focused:

- persistence only
- no orchestration
- no auth logic
- no external API logic

### Integration services

External exchange clients should be isolated from domain orchestration as much as possible.

Examples:

- request signing
- pagination handling
- response mapping

These concerns should not leak across unrelated modules.

## Naming Consistency Rules

The same concept must have the same name across the project.

Examples of what must be cleaned and avoided:

- no mixed `analyse` vs `analyze`
- no technical typos like `tocken`
- no inconsistent queue names like misspelled `excange`

If a term is chosen, use it everywhere:

- folder names
- file names
- DTO names
- entity names
- service method names

## Import Rules

- Import enums from `enums/`.
- Import interfaces from `interfaces/`.
- Import helper types from `types/`.
- Avoid circular imports between modules.
- Prefer direct imports over broad barrels unless the barrel is intentional and stable.

## Error Handling Rules

- Do not swallow unexpected errors silently.
- Re-throw known HTTP errors.
- Wrap unknown failures with clear module-specific messages.
- Avoid duplicating generic try/catch blocks unless they add boundary meaning.

## Testing Rules

- Unit tests cover service logic and pure behaviors.
- Integration tests cover repository + module behavior.
- E2E tests cover key auth and API flows.
- Test file names must mirror the production unit under test.

## Refactor Policy

When touching a backend module:

1. Keep naming aligned with this document.
2. Move contracts into the correct folder.
3. Do not introduce new mixed-purpose files.
4. Rename technical typos when touching affected areas.
5. Run relevant tests after structural changes.

## Review Checklist

Before merging backend code, verify:

- file names follow suffix conventions
- controllers stay thin
- services are focused
- DTOs are only transport contracts
- entities are only persistence models
- interfaces/types/enums live in their own folders
- naming is consistent across module boundaries
- no stale imports after refactor
