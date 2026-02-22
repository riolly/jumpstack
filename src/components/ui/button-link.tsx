import type { VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'
import { createLink } from '@tanstack/react-router'

import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const BasicButtonLink = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof buttonVariants>
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return <a ref={ref} data-slot="button-link" className={cn(buttonVariants({ variant, size, className }))} {...props} />
})
BasicButtonLink.displayName = 'BasicButtonLink'

const ButtonLink = createLink(BasicButtonLink)

export { ButtonLink }
