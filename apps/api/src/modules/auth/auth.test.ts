import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { eq, like } from "drizzle-orm"
import { app } from "../../app"
import { db } from "../../db"
import { user, verification } from "../../db/auth-schema"
import { resetMailerForTests, type SendMailInput, setSendMailForTests } from "../../lib/mailer"

const password = "senha-super-segura-123"
const newPassword = "nova-senha-super-segura-456"
// Better Auth valida o header Origin em requisições com cookie (proteção CSRF);
// um browser real sempre envia. WEB_ORIGIN é um trusted origin no app.
const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173"
const webOrigin = origin

const ACTIVATION_TTL_SEC = 60 * 60 * 24 * 30
const RESET_TTL_SEC = 60 * 60 * 24
const SESSION_TTL_SEC = 60 * 60 * 24 * 30

function uniqueEmail() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

function extractSessionCookie(response: Response): string | null {
  const cookies = response.headers.getSetCookie()
  const sessionCookie = cookies.find((c) => c.startsWith("better-auth.session_token="))
  const value = sessionCookie?.split(";")[0]
  return value ?? null
}

function extractSessionCookieHeader(response: Response): string | undefined {
  return response.headers.getSetCookie().find((c) => c.startsWith("better-auth.session_token="))
}

function extractMaxAge(setCookie: string): number | null {
  const match = setCookie.match(/Max-Age=(\d+)/i)
  return match ? Number(match[1]) : null
}

function decodeJwtPayload(token: string): { iat?: number; exp?: number } {
  const payload = token.split(".")[1]
  if (!payload) return {}
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((payload.length + 3) % 4)
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as {
    iat?: number
    exp?: number
  }
}

async function signUp(email: string) {
  return app.handle(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({
        email,
        password,
        name: "Usuário Teste",
        callbackURL: webOrigin,
      }),
    }),
  )
}

async function flushMail() {
  await Promise.resolve()
  await new Promise((r) => setTimeout(r, 10))
}

async function verifyFromSentMail(sent: SendMailInput[]) {
  const url =
    sent[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? sent[0]?.html?.match(/href="([^"]+)"/)?.[1]
  expect(url).toBeTruthy()
  const verify = await app.handle(
    new Request(url!, { method: "GET", headers: { origin }, redirect: "manual" }),
  )
  expect(verify.status).toBeGreaterThanOrEqual(300)
  expect(verify.status).toBeLessThan(400)
  const autoCookie = extractSessionCookie(verify)
  if (autoCookie) {
    await app.handle(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: { cookie: autoCookie, origin },
      }),
    )
  }
}

async function requestPasswordReset(email: string) {
  return app.handle(
    new Request("http://localhost:3000/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({
        email,
        redirectTo: `${webOrigin}/reset-password`,
      }),
    }),
  )
}

describe("auth email/senha + verificação", () => {
  const sent: SendMailInput[] = []

  beforeEach(() => {
    sent.length = 0
    setSendMailForTests(async (mail) => {
      sent.push(mail)
    })
  })

  afterEach(() => {
    resetMailerForTests()
  })

  it("sign-up cria user não verificado, sem sessão, e dispara 1× sendMail com URL", async () => {
    const email = uniqueEmail()
    const response = await signUp(email)
    expect(response.status).toBeLessThan(400)
    expect(extractSessionCookie(response)).toBeNull()

    await flushMail()
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe(email)
    expect(sent[0]?.subject).toBe("Ative sua conta no CondoPartners")
    expect(sent[0]?.text).toMatch(/ativar sua conta/i)
    expect(sent[0]?.html).toContain("Ativar conta")
    expect(sent[0]?.text).toContain("/api/auth/verify-email?token=")
    expect(sent[0]?.html).toContain("/api/auth/verify-email?token=")

    const rows = await db.select().from(user).where(eq(user.email, email))
    expect(rows[0]?.emailVerified).toBe(false)
  })

  // Better Auth 1.6: ativação de e-mail é JWT (HS256 com BETTER_AUTH_SECRET),
  // não linha na tabela `verification` (essa tabela serve reset-password / OAuth state / OTP).
  // SIS-174 — QA viu `verification` vazia pós-SMTP; comportamento esperado.
  it("sign-up de ativação não grava verification; token JWT no e-mail ativa a conta", async () => {
    const email = uniqueEmail()
    const beforeCount = (await db.select().from(verification)).length

    await signUp(email)
    await flushMail()

    const afterSignUpCount = (await db.select().from(verification)).length
    expect(afterSignUpCount).toBe(beforeCount)

    const token = sent[0]?.text.match(/[?&]token=([^&\s]+)/)?.[1]
    expect(token).toBeTruthy()
    // JWT compact: header.payload.signature
    expect(token!.split(".")).toHaveLength(3)

    const url =
      sent[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? sent[0]?.html?.match(/href="([^"]+)"/)?.[1]
    const verify = await app.handle(
      new Request(url!, { method: "GET", headers: { origin }, redirect: "manual" }),
    )
    expect(verify.status).toBeGreaterThanOrEqual(300)
    expect(verify.status).toBeLessThan(400)

    const rows = await db.select().from(user).where(eq(user.email, email))
    expect(rows[0]?.emailVerified).toBe(true)
    expect((await db.select().from(verification)).length).toBe(beforeCount)
  })

  it("sign-in sem verificar falha sem sessão e reenvia e-mail", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    sent.length = 0

    const response = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password, callbackURL: webOrigin }),
      }),
    )

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(extractSessionCookie(response)).toBeNull()
    const body = (await response.json()) as { code?: string; message?: string }
    expect(body.code ?? body.message ?? "").toMatch(/EMAIL_NOT_VERIFIED|not verified/i)

    await flushMail()
    expect(sent.length).toBeGreaterThanOrEqual(1)
    expect(sent[0]?.to).toBe(email)
  })

  it("verify-email válido marca emailVerified e autentica", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    const url =
      sent[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? sent[0]?.html?.match(/href="([^"]+)"/)?.[1]
    expect(url).toBeTruthy()

    const verify = await app.handle(
      new Request(url!, {
        method: "GET",
        headers: { origin },
        redirect: "manual",
      }),
    )
    expect(verify.status).toBeGreaterThanOrEqual(300)
    expect(verify.status).toBeLessThan(400)
    expect(extractSessionCookie(verify)).toBeTruthy()

    const rows = await db.select().from(user).where(eq(user.email, email))
    expect(rows[0]?.emailVerified).toBe(true)
  })

  it("token inválido/expirado redireciona com erro", async () => {
    const verify = await app.handle(
      new Request(
        `http://localhost:3000/api/auth/verify-email?token=not-a-valid-jwt&callbackURL=${encodeURIComponent(webOrigin)}`,
        { method: "GET", headers: { origin }, redirect: "manual" },
      ),
    )

    expect(verify.status).toBeGreaterThanOrEqual(300)
    expect(verify.status).toBeLessThan(400)
    const location = verify.headers.get("location") ?? ""
    expect(location).toContain("error=")
    expect(location).toMatch(/TOKEN_EXPIRED|INVALID_TOKEN/)
  })

  it("reenvio manual via send-verification-email dispara sendMail", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    sent.length = 0

    const response = await app.handle(
      new Request("http://localhost:3000/api/auth/send-verification-email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, callbackURL: webOrigin }),
      }),
    )
    expect(response.status).toBeLessThan(400)
    await flushMail()
    expect(sent.length).toBeGreaterThanOrEqual(1)
    expect(sent[0]?.to).toBe(email)
  })

  it("após verificar, sign-in / get-session / sign-out funcionam", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    const url =
      sent[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? sent[0]?.html?.match(/href="([^"]+)"/)?.[1]
    const verify = await app.handle(
      new Request(url!, { method: "GET", headers: { origin }, redirect: "manual" }),
    )
    // limpa sessão do auto-sign-in para exercitar sign-in explícito
    const autoCookie = extractSessionCookie(verify)
    if (autoCookie) {
      await app.handle(
        new Request("http://localhost:3000/api/auth/sign-out", {
          method: "POST",
          headers: { cookie: autoCookie, origin },
        }),
      )
    }

    const signIn = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password }),
      }),
    )
    expect(signIn.status).toBeLessThan(400)
    const cookie = extractSessionCookie(signIn)
    expect(cookie).toBeTruthy()

    const session = await app.handle(
      new Request("http://localhost:3000/api/auth/get-session", {
        headers: { cookie: cookie!, origin },
      }),
    )
    expect(session.status).toBe(200)
    const sessionBody = (await session.json()) as { user?: { email?: string } } | null
    expect(sessionBody?.user?.email).toBe(email)

    const signOut = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: { cookie: cookie!, origin },
      }),
    )
    expect(signOut.status).toBeLessThan(400)

    const afterSignOut = await app.handle(
      new Request("http://localhost:3000/api/auth/get-session", {
        headers: { cookie: cookie!, origin },
      }),
    )
    const afterBody = (await afterSignOut.json()) as { user?: unknown } | null
    expect(afterBody?.user ?? null).toBeNull()
  })

  it("recusa sign-in com credencial inválida", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    const url =
      sent[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? sent[0]?.html?.match(/href="([^"]+)"/)?.[1]
    await app.handle(new Request(url!, { method: "GET", headers: { origin }, redirect: "manual" }))

    const response = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password: "senha-errada" }),
      }),
    )

    expect(response.status).toBeGreaterThanOrEqual(400)
  })

  // SIS-191 — TTL ativação 30d (JWT HS256; exp - iat)
  it("JWT de ativação usa TTL de 30 dias e e-mail menciona 30 dias", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()

    expect(sent[0]?.text).toMatch(/30 dias/i)
    expect(sent[0]?.html).toMatch(/30 dias/i)

    const token = sent[0]?.text.match(/[?&]token=([^&\s]+)/)?.[1]
    expect(token).toBeTruthy()
    const payload = decodeJwtPayload(token!)
    expect(payload.iat).toBeDefined()
    expect(payload.exp).toBeDefined()
    expect(payload.exp! - payload.iat!).toBe(ACTIVATION_TTL_SEC)
  })
})

describe("auth reset de senha + lembrar-me (SIS-191)", () => {
  const sent: SendMailInput[] = []

  beforeEach(() => {
    sent.length = 0
    setSendMailForTests(async (mail) => {
      sent.push(mail)
    })
  })

  afterEach(() => {
    resetMailerForTests()
  })

  it("request-password-reset dispara e-mail com URL e TTL 24h", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    await verifyFromSentMail(sent)
    sent.length = 0

    const response = await requestPasswordReset(email)
    expect(response.status).toBeLessThan(400)
    await flushMail()

    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe(email)
    expect(sent[0]?.subject).toBe("Redefina sua senha no CondoPartners")
    expect(sent[0]?.text).toMatch(/24 horas/i)
    expect(sent[0]?.html).toMatch(/24 horas/i)
    expect(sent[0]?.html).toContain("Redefinir senha")
    expect(sent[0]?.text).toContain("/api/auth/reset-password/")
  })

  it("grava verification reset-password:* com expiresAt ≈ now+24h", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    await verifyFromSentMail(sent)
    sent.length = 0

    const before = Date.now()
    await requestPasswordReset(email)
    await flushMail()
    const after = Date.now()

    const rows = await db
      .select()
      .from(verification)
      .where(like(verification.identifier, "reset-password:%"))
    const latest = rows.sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0]
    expect(latest).toBeTruthy()

    const ttlMs = latest!.expiresAt.getTime() - before
    const maxSkewMs = after - before + 5_000
    expect(ttlMs).toBeGreaterThanOrEqual(RESET_TTL_SEC * 1000 - maxSkewMs)
    expect(ttlMs).toBeLessThanOrEqual(RESET_TTL_SEC * 1000 + maxSkewMs)
  })

  it("token válido redefine senha; senha antiga falha e nova autentica", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    await verifyFromSentMail(sent)
    sent.length = 0

    await requestPasswordReset(email)
    await flushMail()
    const token = sent[0]?.text.match(/\/reset-password\/([^?\s]+)/)?.[1]
    expect(token).toBeTruthy()

    const reset = await app.handle(
      new Request("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ token, newPassword }),
      }),
    )
    expect(reset.status).toBeLessThan(400)

    const oldSignIn = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password }),
      }),
    )
    expect(oldSignIn.status).toBeGreaterThanOrEqual(400)

    const newSignIn = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password: newPassword }),
      }),
    )
    expect(newSignIn.status).toBeLessThan(400)
    expect(extractSessionCookie(newSignIn)).toBeTruthy()
  })

  it("token expirado/inválido falha no reset", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    await verifyFromSentMail(sent)
    sent.length = 0

    await requestPasswordReset(email)
    await flushMail()
    const token = sent[0]?.text.match(/\/reset-password\/([^?\s]+)/)?.[1]
    expect(token).toBeTruthy()

    await db
      .update(verification)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(verification.identifier, `reset-password:${token}`))

    const expired = await app.handle(
      new Request("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ token, newPassword }),
      }),
    )
    expect(expired.status).toBeGreaterThanOrEqual(400)

    const invalid = await app.handle(
      new Request("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ token: "token-invalido-sem-verification", newPassword }),
      }),
    )
    expect(invalid.status).toBeGreaterThanOrEqual(400)
  })

  it("sign-in rememberMe true → cookie Max-Age ≈ 30d", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    await verifyFromSentMail(sent)

    const signIn = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password, rememberMe: true }),
      }),
    )
    expect(signIn.status).toBeLessThan(400)
    const header = extractSessionCookieHeader(signIn)
    expect(header).toBeTruthy()
    expect(extractMaxAge(header!)).toBe(SESSION_TTL_SEC)
  })

  it("sign-in rememberMe false → cookie de sessão sem Max-Age persistente", async () => {
    const email = uniqueEmail()
    await signUp(email)
    await flushMail()
    await verifyFromSentMail(sent)

    const signIn = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password, rememberMe: false }),
      }),
    )
    expect(signIn.status).toBeLessThan(400)
    const header = extractSessionCookieHeader(signIn)
    expect(header).toBeTruthy()
    expect(extractMaxAge(header!)).toBeNull()
  })
})
