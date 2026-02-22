import { authed } from '#/orpc/base'

/** Returns the authenticated user's profile. */
export const profile = authed.handler(async ({ context }) => {
  return {
    id: context.user.id,
    name: context.user.name,
    email: context.user.email,
    image: context.user.image,
  }
})
