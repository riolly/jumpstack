import { describe, expect, it } from 'vitest'

import { cn } from '#/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', undefined, 'visible')).toBe('base visible')
  })

  it('merges conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })
})
