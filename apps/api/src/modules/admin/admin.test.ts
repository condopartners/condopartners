import { afterEach, describe, expect, it } from "bun:test"
import { desc, eq } from "drizzle-orm"
import { app } from "../../app"
import { db } from "../../db"
import { adminAuditEvent, user } from "../../db/schema"
import { setMailer } from "../../lib/mailer"

const password = "senha-super-segura-123"
// Better Auth valida o header Origin em requisições com cookie (proteção CSRF).
const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173"
const base = "http://localhost:3000"

function uniqueEmail() {
  return `admin-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

function extractSessionCookie(response: Response): string {
  const cookies = response.headers.getSetCookie()
  const sessionCookie = cookies.find((c) => c.startsWith("better-auth.session_token="))
  const value = sessionCookie?.split(";")[0]
  if (!value) {
    throw new Error(`no session cookie in response: ${JSON.stringify(cookies)}`)
  }
  return value
}

async function signUp(email: string) {
  const response = await app.handle(
    new Request(`${base}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "Usuário Teste" }),
    }),
  )
  expect(response.status).toBeLessThan(400)
  return extractSessionCookie(response)
}

async function signIn(email: string, pass: string) {
  return app.handle(
    new Request(`${base}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password: pass }),
    }),
  )
}

async function getSession(cookie: string) {
  const response = await app.handle(
    new Request(`${base}/api/auth/get-session`, { headers: { cookie, origin } }),
  )
  return (await response.json()) as { user?: { id?: string } } | null
}

async function userIdByEmail(email: string): Promise<string> {
  const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email))
  const id = rows[0]?.id
  if (!id) throw new Error(`user not found: ${email}`)
  return id
}

/** Fixture: cria usuário via sign-up e promove a admin direto no banco (bootstrap ops). */
async function createAdminFixture() {
  const email = uniqueEmail()
  const cookie = await signUp(email)
  await db.update(user).set({ role: "admin" }).where(eq(user.email, email))
  return { email, cookie, id: await userIdByEmail(email) }
}

async function createUserFixture() {
  const email = uniqueEmail()
  const cookie = await signUp(email)
  return { email, cookie, id: await userIdByEmail(email) }
}

function adminRequest(cookie: string, path: string, init?: RequestInit) {
  return app.handle(
    new Request(`${base}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        cookie,
        origin,
        ...(init?.headers ?? {}),
      },
    }),
  )
}

async function lastAuditEvent(targetUserId: string) {
  const rows = await db
    .select()
    .from(adminAuditEvent)
    .where(eq(adminAuditEvent.targetUserId, targetUserId))
    .orderBy(desc(adminAuditEvent.createdAt))
    .limit(1)
  return rows[0] ?? null
}

afterEach(() => {
  setMailer(null)
})

describe("gate de autorização admin", () => {
  const actions: Array<{ method: string; path: (id: string) => string; body?: unknown }> = [
    { method: "GET", path: () => "/api/admin/users" },
    {
      method: "POST",
      path: () => "/api/admin/users",
      body: { email: "x@example.com", name: "X", password },
    },
    { method: "PATCH", path: (id) => `/api/admin/users/${id}`, body: { name: "Novo" } },
    {
      method: "POST",
      path: (id) => `/api/admin/users/${id}/set-password`,
      body: { password: "outra-senha-123" },
    },
    { method: "POST", path: (id) => `/api/admin/users/${id}/revoke-sessions` },
    { method: "POST", path: (id) => `/api/admin/users/${id}/invalidate-password` },
    { method: "POST", path: (id) => `/api/admin/users/${id}/send-password-reset` },
  ]

  it("responde 401 sem sessão", async () => {
    for (const action of actions) {
      const response = await app.handle(
        new Request(`${base}${action.path("qualquer-id")}`, {
          method: action.method,
          headers: { "content-type": "application/json", origin },
          body: action.body ? JSON.stringify(action.body) : undefined,
        }),
      )
      expect(response.status).toBe(401)
    }
  })

  it("responde 403 para usuário sem role admin, sem efeito colateral", async () => {
    const regular = await createUserFixture()
    const target = await createUserFixture()

    for (const action of actions) {
      const response = await adminRequest(regular.cookie, action.path(target.id), {
        method: action.method,
        body: action.body ? JSON.stringify(action.body) : undefined,
      })
      expect(response.status).toBe(403)
    }

    // sem efeito colateral: senha original continua válida e sessão do alvo ativa
    const stillValid = await signIn(target.email, password)
    expect(stillValid.status).toBeLessThan(400)
    expect(await lastAuditEvent(target.id)).toBeNull()
  })
})

describe("listar usuários", () => {
  it("lista com paginação e busca por e-mail", async () => {
    const admin = await createAdminFixture()
    const target = await createUserFixture()

    const page = await adminRequest(admin.cookie, "/api/admin/users?limit=5&offset=0")
    expect(page.status).toBe(200)
    const pageBody = (await page.json()) as { users: unknown[]; total: number; limit: number }
    expect(pageBody.users.length).toBeLessThanOrEqual(5)
    expect(pageBody.total).toBeGreaterThanOrEqual(2)

    const search = await adminRequest(
      admin.cookie,
      `/api/admin/users?search=${encodeURIComponent(target.email)}`,
    )
    expect(search.status).toBe(200)
    const searchBody = (await search.json()) as { users: Array<{ email: string }> }
    expect(searchBody.users.map((u) => u.email)).toContain(target.email)
  })
})

describe("criar conta", () => {
  it("cria usuário com role user, credencial válida e auditoria user.create", async () => {
    const admin = await createAdminFixture()
    const email = uniqueEmail()
    const tempPassword = "senha-temporaria-456"

    const response = await adminRequest(admin.cookie, "/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, name: "Nova Conta", password: tempPassword }),
    })
    expect(response.status).toBe(200)
    const body = (await response.json()) as { user: { id: string; role?: string } }
    expect(body.user.role ?? "user").toBe("user")

    const login = await signIn(email, tempPassword)
    expect(login.status).toBeLessThan(400)

    const audit = await lastAuditEvent(body.user.id)
    expect(audit?.action).toBe("user.create")
    expect(audit?.actorUserId).toBe(admin.id)
    expect(JSON.stringify(audit?.metadata ?? {})).not.toContain(tempPassword)
  })
})

describe("atualizar informações", () => {
  it("atualiza nome e e-mail com auditoria user.update", async () => {
    const admin = await createAdminFixture()
    const target = await createUserFixture()
    const newEmail = uniqueEmail()

    const response = await adminRequest(admin.cookie, `/api/admin/users/${target.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "Nome Atualizado", email: newEmail }),
    })
    expect(response.status).toBe(200)

    const rows = await db.select().from(user).where(eq(user.id, target.id))
    expect(rows[0]?.name).toBe("Nome Atualizado")
    expect(rows[0]?.email).toBe(newEmail)

    const audit = await lastAuditEvent(target.id)
    expect(audit?.action).toBe("user.update")
  })
})

describe("definir senha", () => {
  it("nova senha passa a valer e a antiga falha, com auditoria user.set_password", async () => {
    const admin = await createAdminFixture()
    const target = await createUserFixture()
    const newPassword = "senha-definida-pelo-admin-789"

    const response = await adminRequest(
      admin.cookie,
      `/api/admin/users/${target.id}/set-password`,
      { method: "POST", body: JSON.stringify({ password: newPassword }) },
    )
    expect(response.status).toBe(200)

    const oldLogin = await signIn(target.email, password)
    expect(oldLogin.status).toBeGreaterThanOrEqual(400)
    const newLogin = await signIn(target.email, newPassword)
    expect(newLogin.status).toBeLessThan(400)

    const audit = await lastAuditEvent(target.id)
    expect(audit?.action).toBe("user.set_password")
    expect(JSON.stringify(audit?.metadata ?? {})).not.toContain(newPassword)
  })
})

describe("encerrar sessões", () => {
  it("invalida sessões do alvo com auditoria user.revoke_sessions", async () => {
    const admin = await createAdminFixture()
    const target = await createUserFixture()
    expect((await getSession(target.cookie))?.user?.id).toBe(target.id)

    const response = await adminRequest(
      admin.cookie,
      `/api/admin/users/${target.id}/revoke-sessions`,
      { method: "POST" },
    )
    expect(response.status).toBe(200)

    expect((await getSession(target.cookie))?.user ?? null).toBeNull()

    const audit = await lastAuditEvent(target.id)
    expect(audit?.action).toBe("user.revoke_sessions")
  })
})

describe("invalidar senha", () => {
  it("encerra sessões, invalida a senha atual e audita user.invalidate_password", async () => {
    const admin = await createAdminFixture()
    const target = await createUserFixture()

    const response = await adminRequest(
      admin.cookie,
      `/api/admin/users/${target.id}/invalidate-password`,
      { method: "POST" },
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { resetEmailSent: boolean }
    // sem mailer configurado a ação completa, mas informa que o e-mail não foi enviado
    expect(body.resetEmailSent).toBe(false)

    expect((await getSession(target.cookie))?.user ?? null).toBeNull()
    const oldLogin = await signIn(target.email, password)
    expect(oldLogin.status).toBeGreaterThanOrEqual(400)

    const audit = await lastAuditEvent(target.id)
    expect(audit?.action).toBe("user.invalidate_password")
    // metadata nunca contém a senha aleatória gerada
    expect(JSON.stringify(audit?.metadata ?? {})).not.toContain("password")
  })

  it("com mailer configurado, dispara e-mail de reset e reporta resetEmailSent", async () => {
    const sent: Array<{ to: string }> = []
    setMailer(async (message) => {
      sent.push({ to: message.to })
    })

    const admin = await createAdminFixture()
    const target = await createUserFixture()

    const response = await adminRequest(
      admin.cookie,
      `/api/admin/users/${target.id}/invalidate-password`,
      { method: "POST" },
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { resetEmailSent: boolean }
    expect(body.resetEmailSent).toBe(true)
    expect(sent.map((m) => m.to)).toContain(target.email)
  })
})

describe("enviar link de reset", () => {
  it("sem mailer responde erro explícito pt-BR e não audita", async () => {
    const admin = await createAdminFixture()
    const target = await createUserFixture()

    const response = await adminRequest(
      admin.cookie,
      `/api/admin/users/${target.id}/send-password-reset`,
      { method: "POST" },
    )
    expect(response.status).toBe(503)
    const body = (await response.json()) as { error: string; code?: string }
    expect(body.error).toBe("Não foi possível enviar o e-mail. Verifique a configuração de SMTP.")
    expect(await lastAuditEvent(target.id)).toBeNull()
  })

  it("com mailer configurado envia e-mail com link e audita user.send_password_reset", async () => {
    const sent: Array<{ to: string; text: string }> = []
    setMailer(async (message) => {
      sent.push({ to: message.to, text: message.text })
    })

    const admin = await createAdminFixture()
    const target = await createUserFixture()

    const response = await adminRequest(
      admin.cookie,
      `/api/admin/users/${target.id}/send-password-reset`,
      { method: "POST" },
    )
    expect(response.status).toBe(200)

    const mail = sent.find((m) => m.to === target.email)
    expect(mail).toBeDefined()
    expect(mail?.text).toContain("http")

    const audit = await lastAuditEvent(target.id)
    expect(audit?.action).toBe("user.send_password_reset")
    expect(JSON.stringify(audit?.metadata ?? {})).not.toContain("token")
  })
})
