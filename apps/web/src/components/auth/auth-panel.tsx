import { type FormEvent, useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { AuthLayout } from "@/components/layout/auth-layout"
import { signIn, signUp } from "@/lib/auth-client"

type Mode = "sign-in" | "sign-up"

const GENERIC_ERROR = "Não foi possível autenticar. Verifique os dados e tente de novo."

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("sign-in")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
    <AuthLayout>
      {isSignUp ? (
        <SignUpForm
          name={name}
          email={email}
          password={password}
          error={error}
          submitting={submitting}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          onSwitchToSignIn={() => {
            setError(null)
            setMode("sign-in")
          }}
        />
      ) : (
        <LoginForm
          email={email}
          password={password}
          error={error}
          submitting={submitting}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          onSwitchToSignUp={() => {
            setError(null)
            setMode("sign-up")
          }}
        />
      )}
    </AuthLayout>
  )
}
