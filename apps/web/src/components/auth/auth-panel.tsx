import { type FormEvent, useEffect, useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { VerifyEmailNotice } from "@/components/auth/verify-email-notice"
import { AuthLayout } from "@/components/layout/auth-layout"
import { authClient, signIn, signUp } from "@/lib/auth-client"

type Mode = "sign-in" | "sign-up" | "verify-email"

const GENERIC_ERROR = "Não foi possível autenticar. Verifique os dados e tente de novo."
const UNVERIFIED_ERROR = "Conta ainda não ativada. Verifique seu e-mail ou reenvie o link."
const EXPIRED_LINK_ERROR = "Este link expirou. Solicite um novo e-mail de ativação."
const RESEND_OK = "E-mail reenviado. Confira a caixa de entrada e o spam."

function isUnverifiedError(code?: string | null, message?: string | null) {
  const haystack = `${code ?? ""} ${message ?? ""}`.toLowerCase()
  return haystack.includes("email_not_verified") || haystack.includes("email not verified")
}

function readCallbackError(): string | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  const error = params.get("error")
  if (!error) return null
  if (error === "TOKEN_EXPIRED") return EXPIRED_LINK_ERROR
  if (error === "INVALID_TOKEN") return "Este link de ativação é inválido. Solicite um novo e-mail."
  return GENERIC_ERROR
}

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("sign-in")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [showResend, setShowResend] = useState(false)

  useEffect(() => {
    const callbackError = readCallbackError()
    if (!callbackError) return
    setMode("sign-in")
    setError(callbackError)
    setShowResend(true)
    const url = new URL(window.location.href)
    url.searchParams.delete("error")
    window.history.replaceState({}, "", url.pathname + url.search)
  }, [])

  async function handleResend() {
    if (!email) {
      setError("Informe o e-mail para reenviar o link de ativação.")
      return
    }
    setError(null)
    setMessage(null)
    setResending(true)
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: window.location.origin,
      })
      if (result.error) {
        setError(GENERIC_ERROR)
      } else {
        setMessage(RESEND_OK)
      }
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setResending(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)
    try {
      if (mode === "sign-up") {
        const result = await signUp.email({
          name,
          email,
          password,
          callbackURL: window.location.origin,
        })
        if (result.error) {
          setError(GENERIC_ERROR)
        } else {
          setMode("verify-email")
          setShowResend(true)
        }
      } else {
        const result = await signIn.email({
          email,
          password,
          callbackURL: window.location.origin,
        })
        if (result.error) {
          if (isUnverifiedError(result.error.code, result.error.message)) {
            setError(UNVERIFIED_ERROR)
            setShowResend(true)
          } else {
            setError(GENERIC_ERROR)
            setShowResend(false)
          }
        }
      }
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {mode === "verify-email" ? (
        <VerifyEmailNotice
          email={email}
          message={message}
          error={error}
          submitting={resending}
          onResend={() => void handleResend()}
          onBackToSignIn={() => {
            setError(null)
            setMessage(null)
            setMode("sign-in")
          }}
        />
      ) : mode === "sign-up" ? (
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
            setMessage(null)
            setMode("sign-in")
          }}
        />
      ) : (
        <LoginForm
          email={email}
          password={password}
          error={error}
          submitting={submitting}
          showResend={showResend}
          resending={resending}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          onSwitchToSignUp={() => {
            setError(null)
            setMessage(null)
            setShowResend(false)
            setMode("sign-up")
          }}
          onResendVerification={() => void handleResend()}
        />
      )}
    </AuthLayout>
  )
}
