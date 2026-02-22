import type { QueryClient } from '@tanstack/react-query'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { SignInIcon, SignOutIcon } from '@phosphor-icons/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { GlobalError } from '#/components/global-error'
import { Button } from '#/components/ui/button'
import { ButtonLink } from '#/components/ui/button-link'
import { ModeToggle } from '#/components/ui/mode-toggle'
import { Toaster } from '#/components/ui/sonner'
import { ThemeProvider } from '#/components/ui/theme-provider'
import { appMeta } from '#/lib/app-meta'
import { authClient } from '#/lib/auth-client'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

/** Inline script injected into `<head>` to apply the saved theme before first paint, preventing FOUC. */
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('vite-ui-theme');
      var theme = stored === 'light' || stored === 'dark' ? stored : null;
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.classList.add(theme);
    } catch (e) {}
  })();
`

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: appMeta.title,
      },
      {
        name: 'description',
        content: appMeta.description,
      },
      {
        name: 'og:title',
        content: appMeta.title,
      },
      {
        name: 'og:description',
        content: appMeta.description,
      },
      {
        name: 'og:image',
        content: appMeta.image,
      },
      {
        name: 'og:url',
        content: appMeta.url,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: appMeta.title,
      },
      {
        name: 'twitter:description',
        content: appMeta.description,
      },
      {
        name: 'twitter:image',
        content: appMeta.image,
      },
      {
        name: 'twitter:url',
        content: appMeta.url,
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/logo180.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/logo32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/logo16.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  component: RootComponent,
  errorComponent: ({ error }: ErrorComponentProps) => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <GlobalError error={error} />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  ),
})

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ThemeProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        <nav aria-label="Main navigation" className="flex gap-2 p-2 text-lg">
          <Link
            to="/"
            activeProps={{
              className: 'font-bold',
            }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/posts"
            activeProps={{
              className: 'font-bold',
            }}
          >
            Posts
          </Link>
          <Link
            to="/todos"
            activeProps={{
              className: 'font-bold',
            }}
          >
            Todos
          </Link>
          <Link
            to="/user"
            activeProps={{
              className: 'font-bold',
            }}
          >
            User
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />

            <AuthButtons />
          </div>
        </nav>
        <hr />
        <main>{children}</main>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
        <Toaster />
      </body>
    </html>
  )
}

/** Renders sign-in link or user name + sign-out button based on auth session state. */
function AuthButtons() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  if (isPending) return null

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {session.user.name || session.user.email}
        </span>
        <Button
          variant="ghost"
          onClick={async () => {
            await authClient.signOut()
            router.invalidate()
          }}
        >
          <span className="hidden sm:inline">Sign Out</span>
          <span className="inline sm:hidden">
            <SignOutIcon className="size-5" />
          </span>
        </Button>
      </div>
    )
  }

  return (
    <ButtonLink to="/signin" variant="ghost">
      <span className="text-muted-foreground hidden text-sm sm:inline">Sign In</span>
      <span className="inline sm:hidden">
        <SignInIcon className="size-5" />
      </span>
    </ButtonLink>
  )
}
