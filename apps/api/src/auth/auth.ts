import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import * as schema from "../db/schema"
import { assertSmtpEnvForProduction, buildActivationEmail, sendMail } from "../lib/mailer"

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required")
  }

  assertSmtpEnvForProduction()

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    secret,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    trustedOrigins: [webOrigin],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) => {
        const content = buildActivationEmail({ name: user.name, url })
        void sendMail({
          to: user.email,
          ...content,
        }).catch((err) => {
          console.error("[mailer] failed to send verification email", {
            to: user.email,
            error: err instanceof Error ? err.message : String(err),
          })
        })
      },
    },
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
