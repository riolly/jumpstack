## Tools

- Use **playwright-cli** on the dev server localhost:3000 (run pnpm dev if not running) to interact with the browser and develop the tests. Do not use mcp.

- Use **pnpm test:e2e** or **pnpm playwright ...** for running/verifying the tests on test environment.

## Specialized Agents

Use the agents in `.claude/agents/` for e2e test workflows:

- `playwright-test-planner` — for creating test plans
- `playwright-test-generator` — for generating tests
- `playwright-test-healer` — for debugging and fixing failing tests
