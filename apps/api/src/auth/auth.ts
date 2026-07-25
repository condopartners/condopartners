import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import * as schema from "../db/schema"

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required")
  }

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    secret,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    trustedOrigins: [webOrigin],
    emailAndPassword: { enabled: true, requireEmailVerification: false },
  })
}

let instance: ReturnType<typeof createAuth> | null = null

export function getAuth() {
  instance ??= createAuth()
  return instance
}

export const auth = {
  handler: (request: Request) => getAuth().handler(request),
}
