## Test Suite Structure

```
test/
├── unit/               # isolated class/controller/service specs
├── integration/        # multi-class Nest modules with mocked infrastructure
├── e2e/                # HTTP-level flows via Nest application + Supertest
├── fixtures/           # reusable DTO/entity builders
├── utils/              # lightweight helpers shared across suites
└── jest-*.json         # suite-specific Jest configs
```

### Choosing a Layer

- **Unit**: Individual classes or functions with direct mocks. No Nest testing module.
- **Integration**: Compose multiple Nest providers/controllers via `Test.createTestingModule`, but still mock outbound infrastructure (DB, queues, HTTP).
- **E2E**: Spin up a full Nest application (in-process) and assert HTTP responses with Supertest. Only mock high-risk infrastructure (e.g., external APIs) via providers.

### Commands

| Suite | Command |
| --- | --- |
| Unit | `npm run test:unit` |
| Integration | `npm run test:integration` |
| E2E | `npm run test:e2e` |

`npm run test` executes unit and integration suites sequentially. Run `npm run lint` before pushing to ensure TypeScript + ESLint constraints are satisfied.

### Adding New Tests

1. Pick the appropriate layer using the rules above.
2. Place specs under `test/<layer>/<module-name>/`.
3. Reuse fixtures from `test/fixtures` or add new ones if a scenario repeats across specs.
4. Share helpers through `test/utils` only when at least two specs need them.
5. Update or create suite-specific Jest configs if additional setup is required.

This structure keeps fast unit tests focused, integration specs validating Nest wiring, and e2e tests covering the full HTTP stack without touching real infrastructure.
