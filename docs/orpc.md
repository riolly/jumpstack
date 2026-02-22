# oRPC Layer

## Error Handling (`errors.ts`)

All oRPC handlers must throw structured `ORPCError` via factory functions from `#/orpc/errors` — never plain `Error`. Plain errors are swallowed by oRPC and returned as generic `INTERNAL_SERVER_ERROR` to the client.

### Throwing errors in handlers

```ts
import { badRequest, notFound, unauthorized } from '#/orpc/errors'

// In a handler:
if (!row) throw notFound('todo.not_found')
if (!input.title) throw badRequest('todo.title_required', { field: 'title' })
if (!session) throw unauthorized('auth.unauthorized')
```

Each factory takes:

1. **`code`** — A dot-namespaced key (e.g. `"feature.error_kind"`) that maps to `ERROR_MESSAGES` in `errors.ts`
2. **`params?`** — Optional `Record<string, string>` for template interpolation

### Adding a new error message

1. Add the code + template to `ERROR_MESSAGES` in `src/orpc/errors.ts`:

   ```ts
   const ERROR_MESSAGES: Record<string, string> = {
     'todo.not_found': 'Todo not found',
     'order.limit_exceeded': 'Cannot exceed {{max}} items', // new
   }
   ```

2. Throw using the matching factory:

   ```ts
   throw badRequest('order.limit_exceeded', { max: '50' })
   // Client sees: "Cannot exceed 50 items"
   ```

If a code has no entry in the map, the code string itself is used as the message.

### Adding a new factory (new HTTP status)

Add a new exported function in `errors.ts` following the existing pattern:

```ts
export function conflict(code: string, params?: Record<string, string>) {
  return new ORPCError('CONFLICT', {
    message: resolveMessage(code, params),
    data: { code, params },
  })
}
```

Available oRPC error codes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `TIMEOUT`, `PAYLOAD_TOO_LARGE`, `INTERNAL_SERVER_ERROR`, etc.

### Client-side error display

`getErrorMessage(error)` is used in `src/integrations/tanstack-query/root-provider.tsx` to extract toast messages. It returns:

- The `ORPCError.message` (resolved from the map) for structured errors
- `"Something went wrong"` for unstructured/unknown errors

### Error shape on the client

When a factory-created error reaches the client, it looks like:

```ts
{
  code: 'NOT_FOUND',          // HTTP-level oRPC code
  status: 404,
  message: 'Todo not found',  // Human-readable, from ERROR_MESSAGES
  data: {
    code: 'todo.not_found',   // App-level code (for i18n later)
    params: undefined,
  }
}
```

### i18n readiness

The `data.code` + `data.params` on every error are designed for future i18n: a client-side translator can look up `data.code` in a locale file and interpolate `data.params`, ignoring the English `message` entirely.

## Middleware & Context Patterns

### Context flow

oRPC context carries request-scoped data (headers, auth session) from the entry point to handlers. It flows through two paths:

- **SSR**: `createRouterClient` in `client.ts` supplies `{ headers: getRequestHeaders() }`
- **HTTP**: `RPCHandler.handle()` in `api/rpc/$.ts` supplies `{ headers: request.headers }`

### Procedure bases (`base.ts`)

All procedures must be built from bases defined in `src/orpc/base.ts`, **not** from raw `os`:

```ts
// public -- has headers, no auth required
import { authed, pub } from '#/orpc/base'

// authenticated -- has headers + user + session
```

**Never** import `os` directly from `@orpc/server` in handler files. The bases ensure:

1. Context is typed (`{ headers: Headers }` at minimum)
2. Auth middleware runs automatically for `authed` procedures
3. Headers are available in every handler for auth, locale, etc.

### Writing a public procedure

```ts
import * as z from 'zod'

import { pub } from '#/orpc/base'

export const list = pub.handler(async ({ context }) => {
  // context.headers is typed as Headers
  return db.select().from(items)
})
```

### Writing an authenticated procedure

```ts
import * as z from 'zod'

import { authed } from '#/orpc/base'

export const create = authed.input(z.object({ name: z.string() })).handler(async ({ context, input }) => {
  // context.user and context.session are guaranteed by middleware
  // No need to call auth.api.getSession() manually
  return db.insert(items).values({ name: input.name, ownerId: context.user.id }).returning()
})
```

### Adding custom middleware

Use `base.middleware()` for reusable middleware, `.use()` to attach:

```ts
import { base } from '#/orpc/base'

const rateLimitMiddleware = base.middleware(async ({ context, next }) => {
  // check rate limit using context.headers
  return next() // or next({ context: { ...extra } }) to add context
})

export const expensiveOp = pub
  .use(rateLimitMiddleware)
  .handler(async ({ context }) => { ... })
```

## Router Organization

### Nested structure

The router in `apis/index.ts` is organized by domain:

```ts
import * as post from './posts'
import * as todo from './todos'
import * as user from './user'

export default { todo, post, user }
```

### Conventions

- One file per domain: `apis/todos.ts`, `apis/posts.ts`, `apis/user.ts`
- Export individual procedures (not a sub-router object) -- assembly happens in `apis/index.ts`
- Client access follows the nesting: `orpc.todo.list.queryOptions(...)`, `orpc.user.profile.call(...)`
- When adding a new domain, create `apis/<domain>.ts` and add a namespace in `apis/index.ts`
