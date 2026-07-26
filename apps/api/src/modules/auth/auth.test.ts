import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"
import { app } from "../../app"
import { db } from "../../db"
import { user, verification } from "../../db/auth-schema"
import { resetMailerForTests, type SendMailInput, setSendMailForTests } from "../../lib/mailer"

const password = "senha-super-segura-123"
// Better Auth valida o header Origin em requisições com cookie (proteção CSRF);
// um browser real sempre envia. WEB_ORIGIN é um trusted origin no app.
const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173"
const webOrigin = origin

function uniqueEmail() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
}

function extractSessionCookie(response: Response): string | null {
  const cookies = response.headers.getSetCookie()
  const sessionCookie = cookies.find((c) => c.startsWith("better-auth.session_token="))
  const value = sessionCookie?.split(";")[0]
  return value ?? null
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
})
