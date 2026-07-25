import { describe, expect, it } from "bun:test"
import { app } from "../../app"

const password = "senha-super-segura-123"
// Better Auth valida o header Origin em requisições com cookie (proteção CSRF);
// um browser real sempre envia. WEB_ORIGIN é um trusted origin no app.
const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

function uniqueEmail() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
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
  return app.handle(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name: "Usuário Teste" }),
    }),
  )
}

describe("auth email/senha", () => {
  it("faz sign-up e retorna cookie de sessão", async () => {
    const email = uniqueEmail()
    const response = await signUp(email)

    expect(response.status).toBeLessThan(400)
    expect(() => extractSessionCookie(response)).not.toThrow()
  })

  it("recusa sign-in com credencial inválida", async () => {
    const email = uniqueEmail()
    await signUp(email)

    const response = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "senha-errada" }),
      }),
    )

    expect(response.status).toBeGreaterThanOrEqual(400)
  })

  it("faz sign-in, get-session e sign-out (ciclo completo)", async () => {
    const email = uniqueEmail()
    await signUp(email)

    const signIn = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify({ email, password }),
      }),
    )
    expect(signIn.status).toBeLessThan(400)
    const cookie = extractSessionCookie(signIn)

    const session = await app.handle(
      new Request("http://localhost:3000/api/auth/get-session", {
        headers: { cookie, origin },
      }),
    )
    expect(session.status).toBe(200)
    const sessionBody = (await session.json()) as { user?: { email?: string } } | null
    expect(sessionBody?.user?.email).toBe(email)

    const signOut = await app.handle(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: { cookie, origin },
      }),
    )
    expect(signOut.status).toBeLessThan(400)

    const afterSignOut = await app.handle(
      new Request("http://localhost:3000/api/auth/get-session", {
        headers: { cookie, origin },
      }),
    )
    const afterBody = (await afterSignOut.json()) as { user?: unknown } | null
    expect(afterBody?.user ?? null).toBeNull()
  })
})
