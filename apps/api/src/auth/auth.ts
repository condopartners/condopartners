import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"
import { db } from "../db"
import * as schema from "../db/schema"
import { resolveProdEnv } from "../env"
import { sendMail } from "../lib/mailer"

const webOrigin = resolveProdEnv("WEB_ORIGIN", "http://localhost:5173")

function parseAdminUserIds(): string[] {
  return (process.env.BETTER_AUTH_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required")
  }

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    secret,
    baseURL: resolveProdEnv("BETTER_AUTH_URL", "http://localhost:3000"),
    trustedOrigins: [webOrigin],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await sendMail({
          to: user.email,
          subject: "Redefina sua senha no CondoPartners",
          text: `Olá${user.name ? `, ${user.name}` : ""}!\n\nClique no link para redefinir sua senha:\n${url}\n\nSe você não pediu esta redefinição, ignore esta mensagem.`,
        })
      },
    },
    plugins: [
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
        adminUserIds: parseAdminUserIds(),
      }),
    ],
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
