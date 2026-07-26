import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { LoginForm } from "./login-form"
import { SignUpForm } from "./sign-up-form"
import { VerifyEmailNotice } from "./verify-email-notice"

describe("auth forms", () => {
  test("LoginForm: labels pt-BR, autocomplete e CTA Entrar", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        email=""
        password=""
        error={null}
        submitting={false}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onSwitchToSignUp={() => undefined}
      />,
    )
    expect(html).toContain("Entrar")
    expect(html).toContain("E-mail")
    expect(html).toContain("Senha")
    expect(html).toContain("Criar conta")
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
        error={null}
        submitting
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onSubmit={() => undefined}
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
        error="Não foi possível autenticar. Verifique os dados e tente de novo."
        submitting={false}
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onSwitchToSignUp={() => undefined}
      />,
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain("Não foi possível autenticar. Verifique os dados e tente de novo.")
  })

  test("LoginForm: conta não ativada mostra CTA de reenvio", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        email="a@b.com"
        password=""
        error="Conta ainda não ativada. Verifique seu e-mail ou reenvie o link."
        submitting={false}
        showResend
        onEmailChange={() => undefined}
        onPasswordChange={() => undefined}
        onSubmit={() => undefined}
        onSwitchToSignUp={() => undefined}
        onResendVerification={() => undefined}
      />,
    )
    expect(html).toContain("Conta ainda não ativada")
    expect(html).toContain("Reenviar e-mail de ativação")
  })

  test("SignUpForm: Nome + Criando conta… + new-password", () => {
    const idle = renderToStaticMarkup(
      <SignUpForm
        name=""
        email=""
        password=""
        error={null}
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
    expect(idle).toContain('autoComplete="name"')
    expect(idle).toContain('autoComplete="new-password"')
    expect(idle).toContain("Já tem conta? Entrar")

    const busy = renderToStaticMarkup(
      <SignUpForm
        name="Maria"
        email="a@b.com"
        password="secret"
        error={null}
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

  test("VerifyEmailNotice: copy pós-cadastro e CTA reenvio", () => {
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
    expect(html).toContain("Verifique seu e-mail")
    expect(html).toContain("maria@empresa.com")
    expect(html).toContain("Reenviar e-mail de ativação")
    expect(html).toContain("Ativar conta")
  })
})
