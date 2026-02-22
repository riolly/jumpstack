import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '#/orpc/errors'

let context:
  | {
      queryClient: QueryClient
    }
  | undefined

/**
 * Returns a singleton `{ queryClient }` context. Configures global error toasts
 * on both queries and mutations via `QueryCache`/`MutationCache`, and sets a
 * default 30s `staleTime`.
 */
export function getContext() {
  if (context) {
    return context
  }

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        toast.error(getErrorMessage(error))
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(getErrorMessage(error))
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
    },
  })

  context = {
    queryClient,
  }

  return context
}
