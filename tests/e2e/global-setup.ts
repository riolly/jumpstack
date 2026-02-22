import { execSync, spawn } from 'node:child_process'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import type { ChildProcess } from 'node:child_process'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Client } from 'pg'

export const TEST_DB_URL_PATH = 'tests/e2e/.test-db-url'

function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const check = () => {
      http
        .get(url, (res) => {
          res.resume()
          resolve()
        })
        .on('error', () => {
          if (Date.now() > deadline) {
            reject(new Error(`Server at ${url} not ready within ${timeoutMs}ms`))
          } else {
            setTimeout(check, 500)
          }
        })
    }
    check()
  })
}

async function waitForQueries(connectionUri: string, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const client = new Client({ connectionString: connectionUri })
    try {
      await client.connect()
      await client.query('SELECT 1')
      await client.end()
      return
    } catch {
      await client.end().catch(() => {})
      if (i === maxRetries - 1) throw new Error('Database not ready for queries')
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

export default async function globalSetup() {
  const pg = await new PostgreSqlContainer('postgres:17-alpine')
    .withCommand([
      'postgres',
      '-c',
      'fsync=off',
      '-c',
      'synchronous_commit=off',
      '-c',
      'full_page_writes=off',
      '-c',
      'shared_buffers=256MB',
    ])
    .start()
  const databaseUrl = pg.getConnectionUri()

  // pg_isready passes before Postgres can execute queries — verify with a real query
  await waitForQueries(databaseUrl)

  // Write testcontainer URL to a temp file so Playwright worker processes
  // can read it (process.env changes in globalSetup don't propagate to workers).
  writeFileSync(TEST_DB_URL_PATH, databaseUrl)

  // Hardcoded test env vars — Vite respects process.env over .env file values,
  // so we pass these via the env option to execSync/spawn instead of touching .env.
  const testEnv: Record<string, string> = {
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: 'test-secret-for-e2e-at-least-32chars!!',
    BETTER_AUTH_URL: 'http://localhost:3210',
    SKIP_ENV_VALIDATION: 'true',
  }

  // Push Drizzle schema to the test database
  const serverEnv = { ...process.env, ...testEnv }
  execSync('pnpm db:push', { stdio: 'inherit', env: serverEnv })

  // Warm up: verify the schema tables are queryable before handing off
  // to the dev server. Without this, the first SSR request can hit a
  // "database system is starting up" or connection-pool race.
  const warmup = new Client({ connectionString: databaseUrl })
  await warmup.connect()
  await warmup.query('SELECT count(*) FROM todos')
  await warmup.query('SELECT count(*) FROM posts')
  await warmup.end()

  // Build for production then serve — production React skips StrictMode
  // double-renders, dev warnings, and HMR overhead, so hydration is much faster.
  // Skip rebuild if dist/ is already up-to-date (no src file newer than the build).
  const buildMarker = 'dist/server/server.js'
  let needsBuild = !existsSync(buildMarker)
  if (!needsBuild) {
    const changed = execSync('find src -type f -newer dist/server/server.js -print -quit', {
      encoding: 'utf-8',
    }).trim()
    needsBuild = changed.length > 0
  }

  if (needsBuild) {
    execSync('pnpm build', { stdio: 'inherit', env: serverEnv })
  }

  const server: ChildProcess = spawn('pnpm', ['preview', '--port', '3210'], {
    stdio: 'pipe',
    detached: true,
    env: serverEnv,
  })

  await waitForServer('http://localhost:3210')

  // Returning a function makes it the global teardown
  return async () => {
    // Kill dev server process tree
    if (server.pid) {
      process.kill(-server.pid, 'SIGTERM')
    }
    // Clean up temp file
    if (existsSync(TEST_DB_URL_PATH)) {
      unlinkSync(TEST_DB_URL_PATH)
    }
    await pg.stop()
  }
}
