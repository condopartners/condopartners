import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { MIN_PASSWORD_LENGTH, mapSignUpError } from "./auth-errors"
import { ForgotPasswordForm } from "./forgot-password-form"
import { ForgotPasswordSent } from "./forgot-password-sent"
import { LoginForm } from "./login-form"
import { ResetPasswordForm } from "./reset-password-form"
import { SignUpForm } from "./sign-up-form"
import { VerifyEmailNotice } from "./verify-email-notice"

describe("auth forms", () => {
  test("LoginForm: labels pt-BR, autocomplete e CTA Entrar", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        email=""
        password=""
        rememberMe={false}
        error={null}
        success={null}
        submitting={false}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onRememberMeChange={() => undefined}
        onSubmit={() => undefined}
        onForgotPassword={() => undefined}
        onSwitchToSignUp={() => undefined}
      />,
    )
    expect(html).toContain("Entrar")
    expect(html).toContain("E-mail")
    expect(html).toContain("Senha")
    expect(html).toContain("Criar conta")
    expect(html).toContain("Esqueci minha senha")
    expect(html).toContain("Manter conectado")
    expect(html).toContain("Mantém a sessão por até 30 dias neste dispositivo")
    expect(html).toContain("fechar o navegador")
    // react-dom/server preserva camelCase em atributos React
    expect(html).toContain('autoComplete="email"')
    expect(html).toContain('autoComplete="current-password"')
    expect(html).toContain('spellCheck="false"')
  })

  test("LoginForm: submitting mostra Entrando… e desabilita CTA", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        email="a@b.com"
        password="secret"
        rememberMe={false}
        error={null}
        success={null}
        submitting
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onRememberMeChange={() => undefined}
        onSubmit={() => undefined}
        onForgotPassword={() => undefined}
        onSwitchToSignUp={() => undefined}
      />,
    )
    expect(html).toContain("Entrando…")
    expect(html).toContain("disabled")
  })

  test("LoginForm: erro genérico com role=alert", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        email=""
        password=""
        rememberMe={false}
        error="Não foi possível autenticar. Verifique os dados e tente de novo."
        success={null}
        submitting={false}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onRememberMeChange={() => undefined}
        onSubmit={() => undefined}
        onForgotPassword={() => undefined}
        onSwitchToSignUp={() => undefined}
      />,
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain("Não foi possível autenticar. Verifique os dados e tente de novo.")
  })

  test("LoginForm: banner sucesso pós-reset com role=status", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        email=""
        password=""
        rememberMe={false}
        error={null}
        success="Senha atualizada. Entre com a nova senha."
        submitting={false}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onRememberMeChange={() => undefined}
        onSubmit={() => undefined}
        onForgotPassword={() => undefined}
        onSwitchToSignUp={() => undefined}
      />,
    )
    expect(html).toContain('role="status"')
    expect(html).toContain("Senha atualizada. Entre com a nova senha.")
  })

  test("LoginForm: conta não ativada mostra CTA de reenvio", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        email="a@b.com"
        password=""
        rememberMe={false}
        error="Conta ainda não ativada. Verifique seu e-mail ou reenvie o link."
        success={null}
        submitting={false}
        showResend
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onRememberMeChange={() => undefined}
        onSubmit={() => undefined}
        onForgotPassword={() => undefined}
        onSwitchToSignUp={() => undefined}
        onResendVerification={() => undefined}
      />,
    )
    expect(html).toContain("Conta ainda não ativada")
    expect(html).toContain("Reenviar e-mail de ativação")
  })

  test("SignUpForm: hint de senha + Nome + Criando conta…", () => {
    const idle = renderToStaticMarkup(
      <SignUpForm
        name=""
        email=""
        password=""
        error={null}
        fieldErrors={{}}
        submitting={false}
        onNameChange={() => undefined}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onSwitchToSignIn={() => undefined}
      />,
    )
    expect(idle).toContain("Criar conta")
    expect(idle).toContain("Nome")
    expect(idle).toContain("Use pelo menos 8 caracteres.")
    expect(idle).toContain('autoComplete="name"')
    expect(idle).toContain('autoComplete="new-password"')
    expect(idle).toContain("Já tem conta? Entrar")

    const busy = renderToStaticMarkup(
      <SignUpForm
        name="Maria"
        email="a@b.com"
        password="secret"
        error={null}
        fieldErrors={{}}
        submitting
        onNameChange={() => undefined}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onSwitchToSignIn={() => undefined}
      />,
    )
    expect(busy).toContain("Criando conta…")
  })

  test("SignUpForm: field-error de senha curta com aria-invalid", () => {
    const html = renderToStaticMarkup(
      <SignUpForm
        name="Maria"
        email="a@b.com"
        password="curta"
        error={null}
        fieldErrors={{ password: "A senha deve ter pelo menos 8 caracteres." }}
        submitting={false}
        onNameChange={() => undefined}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onSwitchToSignIn={() => undefined}
      />,
    )
    expect(html).toContain("A senha deve ter pelo menos 8 caracteres.")
    expect(html).toContain('aria-invalid="true"')
    expect(html).not.toContain("Use pelo menos 8 caracteres.")
  })

  test("VerifyEmailNotice: Conta criada + banner sucesso + TTL 30 dias", () => {
    const html = renderToStaticMarkup(
      <VerifyEmailNotice
        email="maria@empresa.com"
        message={null}
        error={null}
        submitting={false}
        onResend={() => undefined}
        onBackToSignIn={() => undefined}
      />,
    )
    expect(html).toContain("Conta criada")
    expect(html).toContain("Conta criada. Verifique seu e-mail para ativar o acesso.")
    expect(html).toContain("maria@empresa.com")
    expect(html).toContain("30 dias")
    expect(html).toContain("Reenviar e-mail de ativação")
    expect(html).toContain("Ativar conta")
    expect(html).toContain('role="status"')
  })

  test("ForgotPasswordForm: copy pedido anti-enumeração 24h", () => {
    const html = renderToStaticMarkup(
      <ForgotPasswordForm
        email=""
        error={null}
        submitting={false}
        onEmailChange={() => undefined}
        onSubmit={() => undefined}
        onBackToSignIn={() => undefined}
      />,
    )
    expect(html).toContain("Redefinir senha")
    expect(html).toContain(
      "Informe o e-mail da conta. Se existir, enviaremos um link válido por 24 horas.",
    )
    expect(html).toContain("Enviar link")
    expect(html).toContain("Voltar para entrar")
  })

  test("ForgotPasswordSent: confirmação genérica", () => {
    const html = renderToStaticMarkup(<ForgotPasswordSent onBackToSignIn={() => undefined} />)
    expect(html).toContain("Verifique seu e-mail")
    expect(html).toContain(
      "Se houver conta com esse e-mail, enviamos um link para redefinir a senha.",
    )
    expect(html).toContain("O link expira em 24 horas")
    expect(html).toContain('role="status"')
  })

  test("ResetPasswordForm: nova senha + hint + erros", () => {
    const idle = renderToStaticMarkup(
      <ResetPasswordForm
        password=""
        confirmPassword=""
        error={null}
        fieldErrors={{}}
        submitting={false}
        onPasswordChange={() => undefined}
        onConfirmPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onRequestNewLink={() => undefined}
      />,
    )
    expect(idle).toContain("Escolha uma nova senha")
    expect(idle).toContain("Nova senha")
    expect(idle).toContain("Confirmar senha")
    expect(idle).toContain("Use pelo menos 8 caracteres.")
    expect(idle).toContain("Salvar nova senha")

    const withError = renderToStaticMarkup(
      <ResetPasswordForm
        password="a"
        confirmPassword="b"
        error="Este link expirou. Solicite um novo e-mail para redefinir a senha."
        fieldErrors={{ confirm: "As senhas não coincidem." }}
        submitting={false}
        onPasswordChange={() => undefined}
        onConfirmPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onRequestNewLink={() => undefined}
      />,
    )
    expect(withError).toContain("As senhas não coincidem.")
    expect(withError).toContain("Pedir novo link")
    expect(withError).toContain("Este link expirou")
  })
})

describe("mapSignUpError", () => {
  test("mapeia códigos Better Auth para field/form copy canônica", () => {
    expect(mapSignUpError({ code: "PASSWORD_TOO_SHORT" })).toEqual({
      fieldErrors: {
        password: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      },
      formError: null,
    })
    expect(mapSignUpError({ code: "PASSWORD_TOO_LONG", maxLength: 128 })).toEqual({
      fieldErrors: { password: "A senha é longa demais. Use no máximo 128 caracteres." },
      formError: null,
    })
    expect(mapSignUpError({ code: "INVALID_PASSWORD" })).toEqual({
      fieldErrors: { password: "Esta senha não atende aos requisitos. Escolha outra." },
      formError: null,
    })
    expect(mapSignUpError({ code: "INVALID_EMAIL" })).toEqual({
      fieldErrors: { email: "Informe um e-mail válido." },
      formError: null,
    })
    expect(mapSignUpError({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toEqual({
      fieldErrors: {},
      formError: "Este e-mail já está em uso. Entre ou use outro e-mail.",
    })
    expect(mapSignUpError({ code: "UNKNOWN" })).toEqual({
      fieldErrors: {},
      formError: "Não foi possível criar a conta. Verifique os dados e tente de novo.",
    })
  })
})
