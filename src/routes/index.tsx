import { GithubLogoIcon } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'

import { JumpStackLogo } from '#/components/jumpstack-logo'
import { buttonVariants } from '#/components/ui/button'
import { appMeta, GITHUB_URL, techStack } from '#/lib/app-meta'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

type Square = {
  top?: string
  bottom?: string
  left?: string
  right?: string
  size: number
  opacity: number
  muted?: boolean
}

const SQUARES: Square[] = [
  // top-left cluster
  { top: '6%', left: '4%', size: 16, opacity: 0.28 },
  { top: '12%', left: '10%', size: 8, opacity: 0.12 },
  { top: '4%', left: '16%', size: 10, opacity: 0.08, muted: true },
  { top: '18%', left: '7%', size: 6, opacity: 0.15 },
  // top-right cluster
  { top: '8%', right: '6%', size: 14, opacity: 0.22 },
  { top: '5%', right: '14%', size: 6, opacity: 0.1, muted: true },
  { top: '16%', right: '4%', size: 10, opacity: 0.18 },
  { top: '14%', right: '18%', size: 8, opacity: 0.08 },
  // bottom-left cluster
  { bottom: '10%', left: '8%', size: 12, opacity: 0.2 },
  { bottom: '6%', left: '3%', size: 6, opacity: 0.1, muted: true },
  { bottom: '16%', left: '14%', size: 8, opacity: 0.14 },
  // bottom-right cluster
  { bottom: '8%', right: '6%', size: 16, opacity: 0.24 },
  { bottom: '16%', right: '12%', size: 8, opacity: 0.12 },
  { bottom: '5%', right: '18%', size: 6, opacity: 0.08, muted: true },
  { bottom: '20%', right: '5%', size: 10, opacity: 0.1 },
  // mid-left scattered
  { top: '35%', left: '2%', size: 8, opacity: 0.1 },
  { top: '55%', left: '5%', size: 10, opacity: 0.12, muted: true },
  { top: '70%', left: '3%', size: 6, opacity: 0.08 },
  // mid-right scattered
  { top: '40%', right: '3%', size: 10, opacity: 0.14 },
  { top: '60%', right: '6%', size: 8, opacity: 0.1, muted: true },
  { top: '75%', right: '2%', size: 12, opacity: 0.08 },
  // top-center sparse
  { top: '3%', left: '35%', size: 6, opacity: 0.06 },
  { top: '2%', right: '30%', size: 8, opacity: 0.05, muted: true },
]

type Line = {
  top?: string
  bottom?: string
  left: string
  width: string
  opacity: number
}

const LINES: Line[] = [
  { top: '12%', left: '2%', width: '12%', opacity: 0.6 },
  { top: '92%', left: '86%', width: '10%', opacity: 0.5 },
  { top: '45%', left: '0%', width: '6%', opacity: 0.4 },
  { top: '52%', left: '94%', width: '6%', opacity: 0.4 },
  { bottom: '24%', left: '4%', width: '8%', opacity: 0.5 },
  { top: '30%', left: '90%', width: '8%', opacity: 0.6 },
]

function Home() {
  return (
    <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center overflow-hidden px-4 py-16">
      {SQUARES.map((sq, i) => (
        <div
          key={i}
          className={sq.muted ? 'bg-muted-foreground' : 'bg-primary'}
          style={{
            position: 'absolute',
            width: sq.size,
            height: sq.size,
            opacity: sq.opacity,
            top: sq.top,
            bottom: sq.bottom,
            left: sq.left,
            right: sq.right,
          }}
        />
      ))}

      {LINES.map((ln, i) => (
        <div
          key={`line-${i}`}
          className="bg-gray-300 dark:bg-gray-700"
          style={{
            position: 'absolute',
            height: 1,
            top: ln.top,
            bottom: ln.bottom,
            left: ln.left,
            width: ln.width,
            opacity: ln.opacity,
          }}
        />
      ))}

      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-8 text-center">
        <JumpStackLogo width={160} height={160} />

        <h1 className="font-mono text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-primary">Jump</span>
          <span className="text-foreground">Stack</span>
        </h1>

        <div className="flex max-w-xl flex-col items-center gap-2">
          <p className="text-muted-foreground font-mono text-sm tracking-wide">{'// ' + appMeta.tagline}</p>
          <div className="h-px w-full bg-gray-300 dark:bg-gray-700" />
          <p className="text-muted-foreground text-sm leading-relaxed">{appMeta.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            <GithubLogoIcon weight="bold" data-icon="inline-start" />
            Star on GitHub
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: 'lg' }))}>
            Get Started
          </a>
        </div>

        <div className="max-w-xxl mt-4 grid w-full grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
          {techStack.map((tech) => (
            <a
              key={tech.name}
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 text-left"
            >
              <span className="bg-primary mt-2.5 inline-block size-1.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100" />
              <span>
                <span className="text-foreground font-mono text-xs font-medium group-hover:underline">{tech.name}</span>
                <span className="text-muted-foreground block font-mono text-[11px]">{tech.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
