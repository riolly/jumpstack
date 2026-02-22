import { ORPCError } from '@orpc/server'

/**
 * Registry of dot-namespaced error codes to human-readable messages.
 * Supports `{{param}}` interpolation. If a code has no entry, the code string itself is used.
 */
const ERROR_MESSAGES: Record<string, string> = {
  'todo.not_found': 'Todo not found',
  'auth.unauthorized': 'You must be logged in to perform this action',
}

function interpolate(template: string, params?: Record<string, string | undefined>): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => params[key] ?? `{{${key}}}`)
}

function resolveMessage(code: string, params?: Record<string, string>): string {
  const template = ERROR_MESSAGES[code]
  if (!template) return code
  return interpolate(template, params)
}

/** Creates an ORPCError with HTTP 404 status. */
export function notFound(code: string, params?: Record<string, string>) {
  return new ORPCError('NOT_FOUND', {
    message: resolveMessage(code, params),
    data: { code, params },
  })
}

/** Creates an ORPCError with HTTP 400 status. */
export function badRequest(code: string, params?: Record<string, string>) {
  return new ORPCError('BAD_REQUEST', {
    message: resolveMessage(code, params),
    data: { code, params },
  })
}

/** Creates an ORPCError with HTTP 401 status. */
export function unauthorized(code: string, params?: Record<string, string>) {
  return new ORPCError('UNAUTHORIZED', {
    message: resolveMessage(code, params),
    data: { code, params },
  })
}

/** Extracts a user-facing message from an error. Returns the resolved ORPCError message, or "Something went wrong" for unknown errors. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ORPCError) {
    return error.message
  }
  if (error instanceof Error) {
    return 'Something went wrong'
  }
  return 'Something went wrong'
}
