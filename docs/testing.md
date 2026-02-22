# Testing Conventions

## File Naming

- Always use `.spec.ts` (never `.test.ts`)
- Unit tests go in `tests/unit/`, mirroring `src/` structure
- E2E tests go in `tests/e2e/`

## Unit Tests (Vitest)

- Use explicit imports: `import { describe, it, expect } from 'vitest'`
- Use `#/*` path aliases to import source code
- Follow Arrange / Act / Assert pattern
- No mocking unless absolutely necessary — prefer testing pure functions

## E2E Tests (Playwright)

- Use relative paths: `page.goto('/todos')`, not full URLs
- Prefer `getByRole` / `getByText` over CSS selectors
- Each test is independent — no shared state between tests
- Import custom fixtures from `tests/e2e/fixtures/base.ts`

### Suspense handling

Pages use `SuspenseQueryBoundary` with skeleton fallbacks.
Always wait for real content to appear before asserting — fixture methods like
`TodosPage.goto()` already handle this by waiting for the suspense boundary to resolve.
For new pages, wait for a known element that only appears after data loads.

### Hydration & retry patterns

E2E tests run against a **production build** (`pnpm build` + `pnpm preview`), which
eliminates most dev-mode hydration issues (StrictMode double-renders, HMR overhead).
However, `expect().toPass()` retry patterns are still used as a safety net for actions
that depend on event handlers (form submissions, checkbox clicks).

**Important**: Retry loops that trigger mutations (e.g. clicking "Add") must be
**idempotent** — check if the action already succeeded before retrying. Otherwise each
retry inserts a duplicate row, causing strict mode violations that snowball.
See `addTodo()` in `fixtures/base.ts` for the pattern:

```ts
await baseExpect(async () => {
  // Only click if the item doesn't exist yet
  if (!(await item.isVisible().catch(() => false))) {
    await input.fill(title)
    await addButton.click()
  }
  await item.waitFor({ state: 'visible', timeout: 3_000 })
}).toPass({ timeout: 30_000, intervals: [1_000] })
```

### Locator strictness

All fixture methods use `.first()` on locators that match by text content
(`todoItem()`, `toggleTodo()`, `deleteTodo()`). This prevents strict mode
violations if a retry loop or previous test left behind duplicate items.

### Warm-up

Test suites that hit pages with SSR + suspense should use `test.beforeAll` to
visit the page once before real tests run. This pre-warms server-side compiled
chunks and caches, so subsequent tests don't pay a cold-start penalty:

```ts
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  await page.goto('/todos')
  await page.getByText('No todos yet').or(page.locator('ul > li').first()).waitFor({ timeout: 30_000 })
  await page.close()
})
```

## E2E Database

### Testcontainer lifecycle (`tests/e2e/global-setup.ts`)

`globalSetup` manages the full lifecycle — **not** Playwright's `webServer` plugin
(which starts the server before globalSetup runs):

1. Start a Postgres testcontainer with durability disabled for speed
   (`fsync=off`, `synchronous_commit=off`, `full_page_writes=off`)
2. Write the testcontainer URL to `tests/e2e/.test-db-url` (temp file)
3. Patch `.env` with the testcontainer URL
4. Push Drizzle schema (`pnpm db:push`)
5. Build for production (skipped if `dist/` is up-to-date with `src/`)
6. Spawn `pnpm preview --port 3210` with `DATABASE_URL` in env
7. Wait for `http://localhost:3210` to respond
8. **Teardown**: kill server, delete temp file, restore `.env`, stop container

### Build caching

The production build is skipped on subsequent runs if no `src/` file is newer
than `dist/server/server.js`. Delete `dist/` to force a rebuild:

```sh
rm -rf dist && pnpm test:e2e
```

### DB cleanup between tests

The `todosPage` fixture truncates the `todos` table before each test via a
direct `pg` connection. It reads the testcontainer URL from the temp file
(`tests/e2e/.test-db-url`) because `process.env` changes in `globalSetup`
do not propagate to Playwright worker processes.

When adding fixtures for new pages that write data, follow the same pattern:
truncate relevant tables in the fixture's setup phase before `use()`.

### Environment

- OAuth env vars are optional in `src/env.ts` — no dummy values needed
- In CI, testcontainers also manages the DB (GitHub Actions runners have Docker)

## Running Tests

```sh
pnpm test              # Unit tests (single run)
pnpm test:watch        # Unit tests (watch mode)
pnpm test:e2e          # E2E tests (testcontainers + production build)
pnpm test:e2e:ui       # E2E tests with Playwright UI
pnpm test:all          # Both unit + E2E
```
