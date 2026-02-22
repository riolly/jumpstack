import * as React from 'react'

import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'

function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-1', className)} {...props} />
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-3', className)} {...props} />
}

function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return <Label className={cn(className)} {...props} />
}

function FieldError({
  errors,
  className,
}: {
  errors: Array<string | { message: string } | undefined>
  className?: string
}) {
  const first = errors.find((e): e is string | { message: string } => e != null)
  if (!first) return null
  return (
    <p className={cn('text-destructive text-xs', className)}>{typeof first === 'string' ? first : first.message}</p>
  )
}

export { Field, FieldError, FieldGroup, FieldLabel }
