import { type FormEvent, useEffect, useState } from "react"
import {
  type FieldErrors,
  MIN_PASSWORD_LENGTH,
  mapResetPasswordError,
  mapSignInError,
  mapSignUpError,
} from "@/components/auth/auth-errors"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { ForgotPasswordSent } from "@/components/auth/forgot-password-sent"
import { LoginForm } from "@/components/auth/login-form"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { VerifyEmailNotice } from "@/components/auth/verify-email-notice"
import { AuthLayout } from "@/components/layout/auth-layout"
import { authClient, signIn, signUp } from "@/lib/auth-client"

type Mode =
  | "sign-in"
  | "sign-up"
  | "verify-email"
  | "forgot-password"
  | "forgot-password-sent"
  | "reset-password"

const GENERIC_ERROR = "Não foi possível autenticar. Verifique os dados e tente de novo."
const RESEND_OK = "E-mail reenviado. Confira a caixa de entrada e o spam."
const RESET_SUCCESS = "Senha atualizada. Entre com a nova senha."
const RESET_GENERIC = "Não foi possível redefinir a senha. Tente de novo."
const REQUEST_RESET_GENERIC = "Não foi possível enviar o link. Verifique o e-mail e tente de novo."

function clearAuthQueryParams() {
  const url = new URL(window.location.href)
  url.searchParams.delete("error")
  url.searchParams.delete("token")
  url.searchParams.delete("auth")
  window.history.replaceState({}, "", url.pathname + url.search + url.hash)
}

function readInitialAuthState(): {
  mode: Mode
  error: string | null
  success: string | null
  showResend: boolean
  resetToken: string | null
} {
  if (typeof window === "undefined") {
    return {
      mode: "sign-in",
      error: null,
      success: null,
      showResend: false,
      resetToken: null,
    }
  }

  const params = new URLSearchParams(window.location.search)
  const auth = params.get("auth")
  const token = params.get("token")
  const error = params.get("error")

  if (token) {
    return {
      mode: "reset-password",
      error: null,
      success: null,
      showResend: false,
      resetToken: token,
    }
  }

  if (auth === "reset" && error) {
    const mapped = mapResetPasswordError({ code: error })
    return {
      mode: "reset-password",
      error: mapped.formError,
      success: null,
      showResend: false,
      resetToken: null,
    }
  }

  if (error === "TOKEN_EXPIRED") {
    return {
      mode: "sign-in",
      error: "Este link expirou. Solicite um novo e-mail de ativação.",
      success: null,
      showResend: true,
      resetToken: null,
    }
  }

  if (error === "INVALID_TOKEN") {
    return {
      mode: "sign-in",
      error: "Este link de ativação é inválido. Solicite um novo e-mail.",
      success: null,
      showResend: true,
      resetToken: null,
    }
  }

  if (error) {
    return {
      mode: "sign-in",
      error: GENERIC_ERROR,
      success: null,
      showResend: false,
      resetToken: null,
    }
  }

  return {
    mode: "sign-in",
    error: null,
    success: null,
    showResend: false,
    resetToken: null,
  }
}

export function AuthPanel() {
  const [boot] = useState(readInitialAuthState)
  const [mode, setMode] = useState<Mode>(boot.mode)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(boot.resetToken)
  const [error, setError] = useState<string | null>(boot.error)
  const [success, setSuccess] = useState<string | null>(boot.success)
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [showResend, setShowResend] = useState(boot.showResend)

  useEffect(() => {
    if (boot.error || boot.resetToken || boot.mode === "reset-password") {
      clearAuthQueryParams()
    }
  }, [boot.error, boot.resetToken, boot.mode])

  function goToSignIn(opts?: { success?: string | null; clearPassword?: boolean }) {
    setMode("sign-in")
    setError(null)
    setMessage(null)
    setFieldErrors({})
    setSuccess(opts?.success ?? null)
    setShowResend(false)
    setResetToken(null)
    setConfirmPassword("")
    if (opts?.clearPassword) setPassword("")
  }

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

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSuccess(null)
    setFieldErrors({})

    if (!name.trim()) {
      setFieldErrors({ name: "Informe seu nome." })
      return
    }

    setSubmitting(true)
    try {
      const result = await signUp.email({
        name: name.trim(),
        email,
        password,
        callbackURL: window.location.origin,
      })
      if (result.error) {
        const mapped = mapSignUpError({
          code: result.error.code,
          message: result.error.message,
        })
        setFieldErrors(mapped.fieldErrors)
        setError(mapped.formError)
      } else {
        setMode("verify-email")
        setShowResend(true)
        setPassword("")
      }
    } catch {
      setError("Não foi possível criar a conta. Verifique os dados e tente de novo.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSuccess(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      const result = await signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: window.location.origin,
      })
      if (result.error) {
        const mapped = mapSignInError({
          code: result.error.code,
          message: result.error.message,
        })
        setError(mapped)
        setShowResend(mapped.includes("ainda não ativada"))
      }
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const redirectTo = `${window.location.origin}/?auth=reset`
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo,
      })
      if (result.error) {
        setError(REQUEST_RESET_GENERIC)
      } else {
        setMode("forgot-password-sent")
      }
    } catch {
      setError(REQUEST_RESET_GENERIC)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldErrors({
        password: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      })
      return
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirm: "As senhas não coincidem." })
      return
    }

    if (!resetToken) {
      setError("Este link é inválido. Solicite um novo e-mail para redefinir a senha.")
      return
    }

    setSubmitting(true)
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token: resetToken,
      })
      if (result.error) {
        const mapped = mapResetPasswordError({
          code: result.error.code,
          message: result.error.message,
        })
        setFieldErrors(mapped.fieldErrors)
        setError(mapped.formError)
      } else {
        goToSignIn({ success: RESET_SUCCESS, clearPassword: true })
      }
    } catch {
      setError(RESET_GENERIC)
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
          onBackToSignIn={() => goToSignIn()}
        />
      ) : mode === "forgot-password" ? (
        <ForgotPasswordForm
          email={email}
          error={error}
          submitting={submitting}
          onEmailChange={setEmail}
          onSubmit={(event) => void handleForgotPassword(event)}
          onBackToSignIn={() => goToSignIn()}
        />
      ) : mode === "forgot-password-sent" ? (
        <ForgotPasswordSent onBackToSignIn={() => goToSignIn()} />
      ) : mode === "reset-password" ? (
        <ResetPasswordForm
          password={password}
          confirmPassword={confirmPassword}
          error={error}
          fieldErrors={fieldErrors}
          submitting={submitting}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={(event) => void handleResetPassword(event)}
          onRequestNewLink={() => {
            setError(null)
            setFieldErrors({})
            setPassword("")
            setConfirmPassword("")
            setResetToken(null)
            setMode("forgot-password")
          }}
        />
      ) : mode === "sign-up" ? (
        <SignUpForm
          name={name}
          email={email}
          password={password}
          error={error}
          fieldErrors={fieldErrors}
          submitting={submitting}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={(event) => void handleSignUp(event)}
          onSwitchToSignIn={() => goToSignIn()}
        />
      ) : (
        <LoginForm
          email={email}
          password={password}
          rememberMe={rememberMe}
          error={error}
          success={success}
          submitting={submitting}
          showResend={showResend}
          resending={resending}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRememberMeChange={setRememberMe}
          onSubmit={(event) => void handleSignIn(event)}
          onForgotPassword={() => {
            setError(null)
            setSuccess(null)
            setMessage(null)
            setFieldErrors({})
            setMode("forgot-password")
          }}
          onSwitchToSignUp={() => {
            setError(null)
            setSuccess(null)
            setMessage(null)
            setFieldErrors({})
            setShowResend(false)
            setMode("sign-up")
          }}
          onResendVerification={() => void handleResend()}
        />
      )}
    </AuthLayout>
  )
}
