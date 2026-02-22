import { eq } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '#/db'
import { todos } from '#/db/schema'
import { pub } from '#/orpc/base'
import { notFound } from '#/orpc/errors'

/** Returns all todos. */
export const list = pub.handler(async () => {
  const rows = await db.select().from(todos)
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    completed: r.completed,
  }))
})

/** Creates a new todo. */
export const add = pub.input(z.object({ title: z.string() })).handler(async ({ input }) => {
  const [newTodo] = await db.insert(todos).values({ title: input.title }).returning()
  return newTodo
})

/** Deletes a todo by ID. */
export const remove = pub.input(z.object({ id: z.number() })).handler(async ({ input }) => {
  const [deleted] = await db.delete(todos).where(eq(todos.id, input.id)).returning()
  return deleted
})

/** Updates a todo's title. */
export const update = pub.input(z.object({ id: z.number(), title: z.string() })).handler(async ({ input }) => {
  const [updated] = await db.update(todos).set({ title: input.title }).where(eq(todos.id, input.id)).returning()
  return updated
})

/** Toggles a todo's completed status. Throws NOT_FOUND if the todo doesn't exist. */
export const toggle = pub.input(z.object({ id: z.number() })).handler(async ({ input }) => {
  const rows = await db.select().from(todos).where(eq(todos.id, input.id))
  if (rows.length === 0) throw notFound('todo.not_found')
  const existing = rows[0]
  const [updated] = await db
    .update(todos)
    .set({ completed: !existing.completed })
    .where(eq(todos.id, input.id))
    .returning()
  return updated
})
