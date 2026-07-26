import { APIError } from "better-auth/api"
import { eq } from "drizzle-orm"
import { Elysia, t } from "elysia"
import { getAuth } from "../../auth/auth"
import { db } from "../../db"
import { user } from "../../db/schema"
import { isMailerConfigured } from "../../lib/mailer"
import { recordAuditEvent } from "./audit"

const errorSchema = t.Object({
  error: t.String(),
  code: t.Optional(t.String()),
})

const userSummarySchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String(),
  emailVerified: t.Boolean(),
  role: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
})

type UserSummary = typeof userSummarySchema.static

const SMTP_ERROR = {
  error: "Não foi possível enviar o e-mail. Verifique a configuração de SMTP.",
  code: "SMTP_NOT_CONFIGURED",
} as const

const NOT_FOUND_ERROR = { error: "Usuário não encontrado.", code: "NOT_FOUND" } as const

function toUserSummary(input: {
  id: string
  name: string
  email: string
  emailVerified: boolean
  role?: string | null
  createdAt: Date
}): UserSummary {
  return {
    id: input.id,
    name: input.name,
    email: input.email,
    emailVerified: input.emailVerified,
    role: input.role ?? null,
    createdAt: input.createdAt.toISOString(),
  }
}

function isAdminSession(sessionUser: { id: string; role?: string | null }): boolean {
  const adminUserIds = (process.env.BETTER_AUTH_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (adminUserIds.includes(sessionUser.id)) return true
  return (sessionUser.role ?? "user").split(",").includes("admin")
}

async function findTargetUser(id: string) {
  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1)
  return rows[0] ?? null
}

/** Gera senha aleatória (>=32 chars) desconhecida pelo usuário; nunca logar/retornar. */
function generateUnknownPassword(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString("base64url")
}

async function requestPasswordResetFor(email: string) {
  await getAuth().api.requestPasswordReset({
    body: { email, redirectTo: process.env.WEB_ORIGIN ?? "http://localhost:5173" },
  })
}

export const adminModule = new Elysia({ name: "admin", prefix: "/api/admin" })
  .derive(async ({ request }) => {
    const session = await getAuth().api.getSession({ headers: request.headers })
    return { adminActor: session?.user ?? null }
  })
  .onBeforeHandle(({ adminActor, set }) => {
    if (!adminActor) {
      set.status = 401
      return { error: "Sessão necessária.", code: "UNAUTHORIZED" }
    }
    if (!isAdminSession(adminActor)) {
      set.status = 403
      return { error: "Acesso restrito a administradores.", code: "FORBIDDEN" }
    }
  })
  .onError(({ error, set }) => {
    if (error instanceof APIError) {
      set.status = error.statusCode ?? 500
      return {
        error: error.body?.message ?? "Não foi possível concluir a ação. Tente de novo.",
        code: typeof error.status === "string" ? error.status : undefined,
      }
    }
  })
  .get("/access", () => ({ isAdmin: true as const }), {
    response: {
      200: t.Object({ isAdmin: t.Literal(true) }),
      401: errorSchema,
      403: errorSchema,
    },
  })
  .get(
    "/users",
    async ({ query, request }) => {
      const result = await getAuth().api.listUsers({
        query: {
          limit: query.limit ?? 20,
          offset: query.offset ?? 0,
          sortBy: "createdAt",
          sortDirection: "desc",
          ...(query.search
            ? {
                searchField: "email" as const,
                searchOperator: "contains" as const,
                searchValue: query.search,
              }
            : {}),
        },
        headers: request.headers,
      })
      return {
        users: result.users.map(toUserSummary),
        total: result.total,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        offset: t.Optional(t.Numeric({ minimum: 0 })),
      }),
      response: {
        200: t.Object({
          users: t.Array(userSummarySchema),
          total: t.Number(),
          limit: t.Number(),
          offset: t.Number(),
        }),
        401: errorSchema,
        403: errorSchema,
      },
    },
  )
  .post(
    "/users",
    async ({ body, request, adminActor }) => {
      // Conta provisionada por admin com senha temporária: já verificada (sem fluxo self-sign-up).
      const created = await getAuth().api.createUser({
        body: {
          email: body.email,
          name: body.name,
          password: body.password,
          role: "user",
          data: { emailVerified: true },
        },
        headers: request.headers,
      })
      await recordAuditEvent({
        actorUserId: adminActor?.id ?? "",
        action: "user.create",
        targetUserId: created.user.id,
        metadata: { email: body.email },
      })
      return { user: toUserSummary(created.user) }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.String({ minLength: 1 }),
        password: t.String({ minLength: 8 }),
      }),
      response: {
        200: t.Object({ user: userSummarySchema }),
        401: errorSchema,
        403: errorSchema,
      },
    },
  )
  .patch(
    "/users/:id",
    async ({ params, body, request, adminActor, set }) => {
      const target = await findTargetUser(params.id)
      if (!target) {
        set.status = 404
        return NOT_FOUND_ERROR
      }
      const data: Record<string, string> = {}
      if (body.name !== undefined) data.name = body.name
      if (body.email !== undefined) data.email = body.email
      const updated = await getAuth().api.adminUpdateUser({
        body: { userId: params.id, data },
        headers: request.headers,
      })
      await recordAuditEvent({
        actorUserId: adminActor?.id ?? "",
        action: "user.update",
        targetUserId: params.id,
        metadata: { fields: Object.keys(data) },
      })
      return { user: toUserSummary(updated) }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String({ format: "email" })),
      }),
      response: {
        200: t.Object({ user: userSummarySchema }),
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
  )
  .post(
    "/users/:id/set-password",
    async ({ params, body, request, adminActor, set }) => {
      const target = await findTargetUser(params.id)
      if (!target) {
        set.status = 404
        return NOT_FOUND_ERROR
      }
      await getAuth().api.setUserPassword({
        body: { userId: params.id, newPassword: body.password },
        headers: request.headers,
      })
      await recordAuditEvent({
        actorUserId: adminActor?.id ?? "",
        action: "user.set_password",
        targetUserId: params.id,
      })
      return { status: true }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ password: t.String({ minLength: 8 }) }),
      response: {
        200: t.Object({ status: t.Boolean() }),
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
  )
  .post(
    "/users/:id/revoke-sessions",
    async ({ params, request, adminActor, set }) => {
      const target = await findTargetUser(params.id)
      if (!target) {
        set.status = 404
        return NOT_FOUND_ERROR
      }
      await getAuth().api.revokeUserSessions({
        body: { userId: params.id },
        headers: request.headers,
      })
      await recordAuditEvent({
        actorUserId: adminActor?.id ?? "",
        action: "user.revoke_sessions",
        targetUserId: params.id,
      })
      return { status: true }
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: t.Object({ status: t.Boolean() }),
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
  )
  .post(
    "/users/:id/invalidate-password",
    async ({ params, request, adminActor, set }) => {
      const target = await findTargetUser(params.id)
      if (!target) {
        set.status = 404
        return NOT_FOUND_ERROR
      }
      // Composição server-side (spec): revogar sessões + senha aleatória desconhecida
      // + e-mail de reset quando houver mailer. Ordem garante que a credencial antiga
      // não sobrevive mesmo se o e-mail falhar.
      await getAuth().api.revokeUserSessions({
        body: { userId: params.id },
        headers: request.headers,
      })
      await getAuth().api.setUserPassword({
        body: { userId: params.id, newPassword: generateUnknownPassword() },
        headers: request.headers,
      })

      let resetEmailSent = false
      if (isMailerConfigured()) {
        try {
          await requestPasswordResetFor(target.email)
          resetEmailSent = true
        } catch (error) {
          console.error("admin: falha ao enviar e-mail de reset após invalidação", error)
        }
      }

      await recordAuditEvent({
        actorUserId: adminActor?.id ?? "",
        action: "user.invalidate_password",
        targetUserId: params.id,
        metadata: { resetEmailSent },
      })
      return { status: true, resetEmailSent }
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: t.Object({ status: t.Boolean(), resetEmailSent: t.Boolean() }),
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
      },
    },
  )
  .post(
    "/users/:id/send-password-reset",
    async ({ params, adminActor, set }) => {
      if (!isMailerConfigured()) {
        set.status = 503
        return SMTP_ERROR
      }
      const target = await findTargetUser(params.id)
      if (!target) {
        set.status = 404
        return NOT_FOUND_ERROR
      }
      await requestPasswordResetFor(target.email)
      await recordAuditEvent({
        actorUserId: adminActor?.id ?? "",
        action: "user.send_password_reset",
        targetUserId: params.id,
      })
      return { status: true }
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: t.Object({ status: t.Boolean() }),
        401: errorSchema,
        403: errorSchema,
        404: errorSchema,
        503: errorSchema,
      },
    },
  )
