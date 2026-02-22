import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { ArrowsClockwiseIcon, WarningIcon } from '@phosphor-icons/react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

import { Button } from '#/components/ui/button'
import { getErrorMessage } from '#/orpc/errors'

interface QueryBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  errorMessage?: string
  errorRender?: (props: { error: Error; reset: () => void }) => ReactNode
}

/**
 * Wraps children in QueryErrorResetBoundary + ErrorBoundary + Suspense.
 * Shows `fallback` while loading, and an inline error with retry on failure.
 *
 * Customize the error UI via:
 * - `errorMessage` — replace just the text, keep the default layout + retry button
 * - `errorRender` — fully custom error UI (takes precedence over `errorMessage`)
 */
export function SuspenseQueryBoundary({ children, fallback, errorMessage, errorRender }: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => {
            if (errorRender) {
              return errorRender({
                error: error as Error,
                reset: resetErrorBoundary,
              })
            }
            const message = errorMessage ?? getErrorMessage(error)
            return (
              <div className="border-muted flex h-full min-h-[200px] w-full flex-col items-center justify-center space-y-3 border border-dashed py-6">
                <div className="bg-destructive/10 rounded-full p-2.5">
                  <WarningIcon className="text-destructive h-5 w-5" />
                </div>
                <div className="flex w-full flex-col items-center space-y-1 text-center">
                  <p className="text-sm font-medium">{message}</p>
                  {error instanceof Error && error.message && error.message !== message && (
                    <p className="text-muted-foreground max-w-sm font-mono text-xs break-all">{error.message}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="gap-1.5">
                  <ArrowsClockwiseIcon className="h-3.5 w-3.5" />
                  Try again
                </Button>
              </div>
            )
          }}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
