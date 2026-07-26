import { Button } from "@/components/ui/button"

export type ForgotPasswordSentProps = {
  onBackToSignIn: () => void
}

export function ForgotPasswordSent({ onBackToSignIn }: ForgotPasswordSentProps) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-card p-6 shadow-[0_1px_2px_rgb(11_31_51_/_0.06)]">
      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
        Verifique seu e-mail
      </h1>

      <p
        className="mb-4 rounded-[var(--radius)] border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/5 px-3 py-2 text-sm text-[var(--cp-success)]"
        role="status"
        aria-live="polite"
      >
        Se houver conta com esse e-mail, enviamos um link para redefinir a senha.
      </p>

      <p className="mb-6 text-sm text-muted-foreground">
        O link expira em 24 horas. Confira também a pasta de spam.
      </p>

      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full touch-manipulation"
        onClick={onBackToSignIn}
      >
        Voltar para entrar
      </Button>
    </section>
  )
}
