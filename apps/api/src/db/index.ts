import { SQL } from "bun"
import { drizzle } from "drizzle-orm/bun-sql"
import * as schema from "./schema"

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://condopartners:condopartners@localhost:5432/condopartners"

const client = new SQL(databaseUrl)

export const db = drizzle({ client, schema })
