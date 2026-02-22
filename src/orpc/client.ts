import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createRouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import router from '#/orpc/apis'

/**
 * Isomorphic oRPC client factory.
 * - **Server**: creates an in-process client via `createRouterClient` (no HTTP round-trip).
 * - **Client**: creates an HTTP client via `RPCLink` that sends requests to `/api/rpc`.
 */
const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(router, {
      context: () => ({
        headers: getRequestHeaders(),
      }),
    }),
  )
  .client((): RouterClient<typeof router> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
    })
    return createORPCClient(link)
  })

export const client: RouterClient<typeof router> = getORPCClient()

/**
 * TanStack Query utilities for oRPC procedures.
 * Use `.queryOptions()` for queries and `.call()` for mutations.
 */
export const orpc = createTanstackQueryUtils(client)
