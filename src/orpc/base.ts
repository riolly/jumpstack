import { os } from '@orpc/server'

import { auth } from '#/lib/auth'
import { unauthorized } from '#/orpc/errors'

/** Root oRPC base with typed `{ headers: Headers }` context. */
export const base = os.$context<{ headers: Headers }>()

/** Public procedure base. Has headers context but requires no authentication. */
export const pub = base

const authMiddleware = base.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers })
  if (!session) throw unauthorized('auth.unauthorized')
  return next({ context: { user: session.user, session: session.session } })
})

/** Authenticated procedure base. Validates session and adds `user` + `session` to context. */
export const authed = base.use(authMiddleware)
