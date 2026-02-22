import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { orpc } from '#/orpc/client'

const listPostsOptions = orpc.post.list.queryOptions()

export const Route = createFileRoute('/posts')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(listPostsOptions)
  },
  component: PostsComponent,
})

function PostsComponent() {
  const { data: posts } = useSuspenseQuery(listPostsOptions)

  const { mutate: populatePosts, isPending } = useMutation({
    mutationFn: () => orpc.post.populate.call(),
    onSuccess: (_data, _variables, _onMutateResult, context) => context.client.invalidateQueries(listPostsOptions),
  })

  return (
    <div className="mx-auto w-full max-w-2xl overflow-x-auto p-4">
      {posts.length === 0 && (
        <Button onClick={() => populatePosts()} disabled={isPending} className="mb-4 w-full sm:w-auto">
          {isPending ? 'Populating…' : 'Populate Posts'}
        </Button>
      )}

      <ul className="min-w-0 list-disc space-y-1 pl-4">
        {posts.map((post) => (
          <li key={post.id} className="max-w-full wrap-break-word" style={{ overflowWrap: 'anywhere' }}>
            {post.title.substring(0, 60)}
          </li>
        ))}
      </ul>
    </div>
  )
}
