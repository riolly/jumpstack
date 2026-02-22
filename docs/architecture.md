# Architecture Guide

## 1. System Overview

```txt
src/
  routes/                    # File-based routes (TanStack Router)
    __root.tsx               # Root layout: nav, providers, devtools
    index.tsx                # Home page
    signin.tsx               # Sign in (email + social)
    signup.tsx               # Sign up (email + social)
    posts.tsx                # Posts list + populate
    todos.tsx                # Example Todo CRUD with TanStack Form
    _authed.tsx              # Auth layout guard (redirects to /signin)
    _authed/user.tsx         # User profile (protected)
    api/
      rpc.$.ts               # oRPC HTTP handler (catch-all)
      auth/$.ts              # better-auth HTTP handler (catch-all)

  orpc/                      # Type-safe API layer
    client.ts                # Isomorphic oRPC client + TanStack Query utils
    base.ts                  # Procedure bases (pub, authed) + auth middleware
    errors.ts                # ORPCError factories + message registry
    query-options.ts         # Shared query options (reusable across routes)
    apis/
      index.ts               # Router assembly (nested by domain)
      todos.ts               # example Todo CRUD procedures
      posts.ts               # Post list + populate procedures
      user.ts                # User profile procedure (authed)

  db/
    index.ts                 # Drizzle client
    schema.ts                # App tables (todos, posts)
    auth-schema.ts           # better-auth tables

  lib/
    auth.ts                  # better-auth server config
    auth-client.ts           # better-auth React client
    utils.ts                 # Shared utilities (cn, etc.)

  integrations/
    tanstack-query/
      root-provider.tsx      # QueryClient setup + global error toasts
      devtools.tsx           # TanStack Query devtools

  components/
    ui/                      # shadcn/ui primitives
    suspense-query-boundary.tsx  # Reusable Suspense + error boundary
    component-example.tsx    # Home page demo component
    not-found.tsx            # Not found page
    global-error.tsx         # Global error boundary

  env.ts                     # T3Env environment variable validation
  styles.css                 # Global styles + Tailwind theme
  router.tsx                 # Router factory with SSR query integration
```

### Two Request Lifecycles

**SSR (server-side render) -- first page load or `loader`/`beforeLoad`:**

1. Browser requests a page (e.g. `/todos`)
2. TanStack Start renders the route on the server
3. `loader` calls `queryClient.ensureQueryData(orpc.todo.list.queryOptions(...))`
4. `orpc` resolves to the **server-side client** (`createRouterClient`), which calls the oRPC handler directly in-process -- no HTTP round-trip
5. Context is supplied via `() => ({ headers: getRequestHeaders() })`, so auth cookies are available
6. Handler runs, queries Drizzle, returns data
7. TanStack Query caches the result, HTML is sent to browser with hydrated data

**Client-side (after hydration, mutations, refetches):**

1. User triggers an action (e.g. clicks "Add Todo")
2. `useMutation` calls `orpc.todo.add.call({ title })`
3. `orpc` resolves to the **client-side client** (`RPCLink`), which sends `POST /api/rpc/todo.add`
4. TanStack Start routes the request to `api/rpc/$.ts`
5. `RPCHandler.handle(request, { context: { headers: request.headers } })` dispatches to the correct oRPC handler
6. Handler runs, queries Drizzle, returns data
7. Response is sent back, `onSuccess` invalidates the query, UI re-renders

---

## 2. How Each Piece Connects

### TanStack Start (SSR framework)

The meta-framework layer. Provides `createServerFn` (server-only functions callable from client) and `createIsomorphicFn` (branching logic by environment). The app entry and dev server are configured in `app.config.ts`.

- `createServerFn` -- Used in `_authed.tsx` to check auth on the server during route guards
- `createIsomorphicFn` -- Used in `orpc/client.ts` to return different oRPC clients per environment

### TanStack Router (file-based routing)

Routes live in `src/routes/`. The router uses `createRootRouteWithContext<{ queryClient: QueryClient }>()` so every route's `loader` and `beforeLoad` receive `context.queryClient`.

- `loader` -- Prefetch data on the server before render (calls `ensureQueryData`)
- `beforeLoad` -- Guards (e.g. auth checks) that run before the route renders
- Layout routes -- `_authed.tsx` is a layout that protects all routes under `_authed/`

### TanStack Query (cache + async state)

All server data flows through TanStack Query. The `QueryClient` is created in `src/integrations/tanstack-query/root-provider.tsx` with global error handling (toast on error via `QueryCache`/`MutationCache`).

- **Queries**: Created via `orpc.<domain>.<procedure>.queryOptions({ input })`, consumed with `useSuspenseQuery`
- **Mutations**: Created via `useMutation` with `mutationFn: () => orpc.<domain>.<procedure>.call(input)`
- **Cache invalidation**: `queryClient.invalidateQueries({ queryKey: <queryOptions>.queryKey })`

### oRPC (type-safe API layer)

Defines the API contract. Procedures are built from typed bases in `src/orpc/base.ts` (`pub` for public, `authed` for authenticated), organized by domain in `src/orpc/apis/`, assembled as a nested router in `apis/index.ts`, and served via two paths:

- **HTTP**: `src/routes/api/rpc/$.ts` -- catch-all route that uses `RPCHandler` with `context: { headers: request.headers }`
- **SSR**: `src/orpc/client.ts` -- `createRouterClient` with `context: () => ({ headers: getRequestHeaders() })`

The isomorphic client in `src/orpc/client.ts` plus `createTanstackQueryUtils` provide `.queryOptions()` and `.call()` for seamless TanStack Query integration.

### better-auth (authentication)

Configured in `src/lib/auth.ts` with Drizzle adapter, email/password, and social providers (Google, Facebook). Uses the `tanstackStartCookies()` plugin for cookie handling in SSR.

- **Server**: `auth.api.getSession({ headers })` to validate sessions
- **Client**: `authClient` from `better-auth/react` provides `useSession()`, `signIn.email()`, `signIn.social()`, `signOut()`
- **Route handler**: `src/routes/api/auth/$.ts` proxies all `/api/auth/*` requests to `auth.handler(request)`

### Drizzle ORM (database)

Schema in `src/db/schema.ts` (app tables) and `src/db/auth-schema.ts` (better-auth tables). Connection in `src/db/index.ts` using `drizzle(env.DATABASE_URL)`.

---

## 3. Architecture Decisions

### Context & Middleware

All oRPC procedures are built from typed bases in `src/orpc/base.ts`:

- **`pub`** -- Public procedure base. Has typed `{ headers: Headers }` context but requires no authentication.
- **`authed`** -- Authenticated procedure base. Runs auth middleware that validates the session via `auth.api.getSession({ headers: context.headers })` and adds `user` + `session` to context.

Headers flow into context through two paths:

- **SSR**: `createRouterClient` in `client.ts` supplies `{ headers: getRequestHeaders() }`
- **HTTP**: `RPCHandler.handle()` in `api/rpc/$.ts` supplies `{ headers: request.headers }`

### Auth patterns: route guards vs procedure middleware

Two distinct auth mechanisms serve different purposes:

- **Route guards** (`beforeLoad` in `_authed.tsx`): Use `createServerFn` + `auth.api.getSession()`. Controls whether a route renders -- runs during navigation.
- **Procedure auth** (oRPC `authed` base): Middleware validates per-API-call. Controls data access -- runs for both SSR and client-side HTTP calls.

### Nested router structure

The router in `apis/index.ts` is organized by domain:

```ts
import * as post from './posts'
import * as todo from './todos'
import * as user from './user'

export default { todo, post, user }
```

Client usage follows the nesting: `orpc.todo.list.queryOptions(...)`, `orpc.user.profile.call(...)`.

---

## 4. Development Patterns

### Adding a new todos end-to-end

**1. Define the database schema** (`src/db/schema.ts`):

```ts
export const projects = pgTable('projects', {
  id: serial().primaryKey(),
  name: text().notNull(),
  ownerId: text('owner_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
```

Then push: `pnpm db:push`

**2. Create oRPC handlers** (`src/orpc/apis/projects.ts`):

```ts
import { eq } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '#/db'
import { projects } from '#/db/schema'
import { authed } from '#/orpc/base'

export const list = authed.handler(async ({ context }) => {
  return db.select().from(projects).where(eq(projects.ownerId, context.user.id))
})

export const create = authed.input(z.object({ name: z.string().min(1) })).handler(async ({ context, input }) => {
  const [project] = await db.insert(projects).values({ name: input.name, ownerId: context.user.id }).returning()
  return project
})
```

**3. Register in the router** (`src/orpc/apis/index.ts`):

```ts
import * as project from './projects'

export default {
  // ...existing domains
  project,
}
```

**4. Create the route** (`src/routes/_authed/projects.tsx`):

```ts
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { orpc } from '#/orpc/client'

const listOptions = orpc.project.list.queryOptions()

export const Route = createFileRoute('/_authed/projects')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listOptions)
  },
  component: ProjectsComponent,
})

function ProjectsComponent() {
  const { data: projects } = useSuspenseQuery(listOptions)
  const queryClient = useQueryClient()

  const { mutate: create } = useMutation({
    mutationFn: (input: { name: string }) => orpc.project.create.call(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listOptions.queryKey }),
  })

  // render...
}
```

### Adding a protected procedure

Use the `authed` base. The auth middleware will validate the session and provide `context.user`:

```ts
import { authed } from '#/orpc/base'

export const deleteAccount = authed.handler(async ({ context }) => {
  await db.delete(users).where(eq(users.id, context.user.id))
  return { deleted: true }
})
```

If the user is not authenticated, the middleware throws `unauthorized('auth.unauthorized')` before the handler runs.

### Error handling

**Throwing errors** -- always use factory functions from `#/orpc/errors`:

```ts
import { badRequest, notFound, unauthorized } from '#/orpc/errors'

// In a handler:
if (!row) throw notFound('todo.not_found')
if (!input.title) throw badRequest('todo.title_required')
```

**Adding error messages** -- add to `ERROR_MESSAGES` in `src/orpc/errors.ts`:

```ts
const ERROR_MESSAGES: Record<string, string> = {
  'todo.not_found': 'Todo not found',
  'project.name_taken': 'A project with that name already exists',
}
```

**Client-side display** -- errors are automatically toasted via the global `QueryCache`/`MutationCache` `onError` handlers in `root-provider.tsx`. For custom handling:

```ts
const { mutate, error } = useMutation({
  mutationFn: () => orpc.project.create.call({ name }),
  onError: (error) => {
    // error is an ORPCError with .message, .data.code, .data.params
  },
})
```

### Cache invalidation after mutations

Use `queryClient.invalidateQueries` with the query key from `queryOptions`:

```ts
const listOptions = orpc.todo.list.queryOptions()

const { mutate } = useMutation({
  mutationFn: (input) => orpc.todo.add.call(input),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: listOptions.queryKey }),
})
```

For invalidating multiple related queries:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: listOptions.queryKey })
  queryClient.invalidateQueries({ queryKey: statsOptions.queryKey })
}
```

### Form handling with TanStack Form

Pattern from `todos.tsx`:

```ts
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

const form = useForm({
  defaultValues: { title: '' },
  onSubmit: async ({ value }) => {
    mutate({ title: value.title.trim() })
    form.reset()
  },
})

// In JSX:
<form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }}>
  <form.Field
    name="title"
    validators={{ onChange: z.string().min(1, 'Required') }}
  >
    {(field) => (
      <Input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
    )}
  </form.Field>
</form>
```

### SSR data prefetching pattern

Every route that displays server data should prefetch in `loader`. There are two strategies:

**Blocking (await) — page waits for data before rendering:**

```ts
const queryOptions = orpc.<domain>.<procedure>.queryOptions()

export const Route = createFileRoute('/path')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(queryOptions)
  },
  component: Component,
})

function Component() {
  const { data } = useSuspenseQuery(queryOptions)
  // data is guaranteed available — no loading state needed
}
```

**Streaming (no await) — page renders immediately, data streams in:**

```ts
const queryOptions = orpc.<domain>.<procedure>.queryOptions()

export const Route = createFileRoute('/path')({
  loader: async ({ context }) => {
    // No await — starts the fetch but doesn't block rendering
    context.queryClient.ensureQueryData(queryOptions)
  },
  component: Component,
})

function Component() {
  // Static shell renders immediately (header, form, layout)
  return (
    <div>
      <h1>Title</h1>
      <SuspenseQueryBoundary fallback={<Skeleton />}>
        <DataList />
      </SuspenseQueryBoundary>
    </div>
  )
}

// Data component lives INSIDE the SuspenseQueryBoundary
function DataList() {
  const { data } = useSuspenseQuery(queryOptions)
  return <ul>{data.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}
```

Key rules for streaming:

1. **Don't `await`** `ensureQueryData` in the loader — this starts the fetch without blocking
2. **Extract the data-dependent UI** into a child component — `useSuspenseQuery` must be called inside the `SuspenseQueryBoundary`, not above it
3. **Static shell renders first** (header, forms, layout), then data streams in when ready

Use blocking for critical above-the-fold data. Use streaming for lists, secondary content, or slow queries where showing a skeleton improves perceived performance.

### SuspenseQueryBoundary (`src/components/query-boundary.tsx`)

Reusable wrapper that combines `QueryErrorResetBoundary` + `react-error-boundary` + `Suspense`. Shows a loading fallback while data loads, and an inline error with retry on failure.

```tsx
import { SuspenseQueryBoundary } from '#/components/suspense-query-boundary'

// Default — shows oRPC error message + retry button on failure
<SuspenseQueryBoundary fallback={<Skeleton />}>
  <DataComponent />
</SuspenseQueryBoundary>

// Custom error text — keeps default layout + retry button
<SuspenseQueryBoundary fallback={<Skeleton />} errorMessage="Failed to load items.">
  <DataComponent />
</SuspenseQueryBoundary>

// Fully custom error UI
<SuspenseQueryBoundary
  fallback={<Skeleton />}
  errorRender={({ error, reset }) => (
    <div>
      <p>{error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <DataComponent />
</SuspenseQueryBoundary>
```

`ensureQueryData` only fetches if the data isn't already cached. During SSR, this runs the oRPC handler in-process (no HTTP). On client-side navigation, it uses the cache or fetches via HTTP.
