import { drizzle } from 'drizzle-orm/node-postgres'

import { env } from '#/env'
import * as schema from './schema.ts'

/** Drizzle ORM client connected to `DATABASE_URL` with app schema. */
export const db = drizzle(env.DATABASE_URL, { schema })
