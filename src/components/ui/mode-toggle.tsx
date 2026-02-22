import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'

import { Button } from '#/components/ui/button'
import { useTheme } from './theme-provider'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggleTheme}
      title={mounted ? (isDark ? 'Toggle light mode' : 'Toggle dark mode') : 'Toggle theme'}
    >
      <MoonIcon className="size-5 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <SunIcon className="absolute size-5 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
