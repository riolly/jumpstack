import { orpc } from '#/orpc/client'

/** Shared query options for the current user's profile. */
export const profileOptions = orpc.user.profile.queryOptions()
