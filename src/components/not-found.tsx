import { HouseIcon, QuestionMarkIcon } from '@phosphor-icons/react'

import { ButtonLink } from '#/components/ui/button-link'

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-muted rounded-full p-4">
            <QuestionMarkIcon className="text-muted-foreground h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist or has been moved.</p>
        </div>

        <div className="flex justify-center">
          <ButtonLink to="/" variant="outline" className="gap-2">
            <HouseIcon className="h-4 w-4" />
            Go home
          </ButtonLink>
        </div>
      </div>
    </div>
  )
}
