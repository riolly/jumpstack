import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { auth } from '#/lib/auth'

/** Fetches the current auth session on the server using request cookies. */
const fetchAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await auth.api.getSession({
    headers: getRequestHeaders(),
  })
  return session
})

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const session = await fetchAuthSession()

    if (!session) {
      throw redirect({ to: '/signin' })
    }

    return { session }
  },
  component: () => <Outlet />,
})
