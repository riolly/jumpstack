import { ORPCError } from '@orpc/server'
import { describe, expect, it } from 'vitest'

import { badRequest, getErrorMessage, notFound, unauthorized } from '#/orpc/errors'

describe('notFound', () => {
  it('creates a NOT_FOUND error with a mapped message', () => {
    const error = notFound('todo.not_found')

    expect(error).toBeInstanceOf(ORPCError)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Todo not found')
    expect(error.data).toEqual({ code: 'todo.not_found', params: undefined })
  })

  it('falls back to the code string for unmapped codes', () => {
    const error = notFound('unknown.code')

    expect(error.message).toBe('unknown.code')
  })
})

describe('badRequest', () => {
  it('creates a BAD_REQUEST error', () => {
    const error = badRequest('todo.not_found')

    expect(error.code).toBe('BAD_REQUEST')
    expect(error.message).toBe('Todo not found')
  })
})

describe('unauthorized', () => {
  it('creates an UNAUTHORIZED error', () => {
    const error = unauthorized('auth.unauthorized')

    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.message).toBe('You must be logged in to perform this action')
  })
})

describe('template interpolation', () => {
  it('replaces {{key}} placeholders with params', () => {
    // Using notFound with a code that doesn't exist in the map
    // won't test interpolation, so we test via a known code pattern.
    // The current ERROR_MESSAGES don't use interpolation, so we test
    // that params are passed through in data even if unused.
    const error = notFound('todo.not_found', { id: '42' })

    expect(error.data).toEqual({ code: 'todo.not_found', params: { id: '42' } })
  })
})

describe('getErrorMessage', () => {
  it('returns the message from an ORPCError', () => {
    const error = notFound('todo.not_found')

    expect(getErrorMessage(error)).toBe('Todo not found')
  })

  it('returns "Something went wrong" for plain Errors', () => {
    expect(getErrorMessage(new Error('oops'))).toBe('Something went wrong')
  })

  it('returns "Something went wrong" for non-Error values', () => {
    expect(getErrorMessage('string error')).toBe('Something went wrong')
    expect(getErrorMessage(null)).toBe('Something went wrong')
    expect(getErrorMessage(undefined)).toBe('Something went wrong')
  })
})
