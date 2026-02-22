import { db } from '#/db'
import { posts } from '#/db/schema'
import { pub } from '#/orpc/base'

/** Returns all posts. */
export const list = pub.handler(async () => {
  return await db.select().from(posts)
})

/** Fetches 20 sample posts from JSONPlaceholder and inserts them. Non-idempotent — inserts duplicates on repeated calls. */
export const populate = pub.handler(async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts')
  const data = (await res.json()) as Array<{ title: string; body: string }>
  const rows = data.slice(0, 20).map((p) => ({
    title: p.title,
    body: p.body,
  }))
  await db.insert(posts).values(rows)
  return { inserted: rows.length }
})
