import { ArrowsClockwiseIcon, HouseIcon, WarningIcon } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { ButtonLink } from './ui/button-link'

interface GlobalErrorProps {
  error: Error
}

export function GlobalError({ error }: GlobalErrorProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-destructive/10 rounded-full p-4">
            <WarningIcon className="text-destructive h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. You can try refreshing the page or go back home.
          </p>
        </div>

        {error.message && (
          <div className="bg-muted/50 rounded-lg border px-4 py-3 text-left">
            <p className="text-muted-foreground font-mono text-xs break-all">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="default" onClick={() => router.invalidate()} className="gap-2">
            <ArrowsClockwiseIcon className="h-4 w-4" />
            Try again
          </Button>
          <ButtonLink to="/" variant="outline" className="gap-2">
            <HouseIcon className="h-4 w-4" />
            Go home
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
