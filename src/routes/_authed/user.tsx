import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { profileOptions } from '#/orpc/query-options'

export const Route = createFileRoute('/_authed/user')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(profileOptions)
  },
  component: UserComponent,
})

function UserComponent() {
  const { data: profile } = useSuspenseQuery(profileOptions)

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="space-y-2">
        <p className="text-lg font-medium">Welcome, {profile.name || 'User'}!</p>
        <p className="text-muted-foreground">Email: {profile.email}</p>
      </div>
    </div>
  )
}
