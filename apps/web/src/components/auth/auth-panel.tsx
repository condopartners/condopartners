import { type FormEvent, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { signIn, signUp } from "@/lib/auth-client"

type Mode = "sign-in" | "sign-up"

const GENERIC_ERROR = "Não foi possível autenticar. Verifique os dados e tente de novo."

const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("sign-in")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const nameId = useId()
  const emailId = useId()
  const passwordId = useId()

  const isSignUp = mode === "sign-up"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = isSignUp
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password })
      if (result.error) {
        setError(GENERIC_ERROR)
      }
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">
        {isSignUp ? "Criar conta" : "Entrar"}
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {isSignUp && (
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor={nameId}>
              Nome
            </label>
            <input
              id={nameId}
              className={inputClass}
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={emailId}>
            E-mail
          </label>
          <input
            id={emailId}
            className={inputClass}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor={passwordId}>
            Senha
          </label>
          <input
            id={passwordId}
            className={inputClass}
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {isSignUp ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="mt-3 w-full"
        onClick={() => {
          setError(null)
          setMode(isSignUp ? "sign-in" : "sign-up")
        }}
      >
        {isSignUp ? "Já tenho conta — Entrar" : "Criar conta"}
      </Button>
    </section>
  )
}
