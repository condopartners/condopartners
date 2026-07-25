import { APP_NAME } from "@condopartners/shared"
import { AuthPanel } from "@/components/auth/auth-panel"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "@/lib/auth-client"

export function App() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Carregando…</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <AuthPanel />
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">{APP_NAME}</p>
          <p className="font-medium">Olá, {session.user.email}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void signOut()}>
          Sair
        </Button>
      </header>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Bem-vindo ao CondoPartners</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fundação de autenticação ativa. O shell de produto chega em uma fatia futura.
        </p>
      </section>
    </main>
  )
}
