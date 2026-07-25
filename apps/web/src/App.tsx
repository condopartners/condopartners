import { AuthPanel } from "@/components/auth/auth-panel"
import { AppShell } from "@/components/layout/app-shell"
import { signOut, useSession } from "@/lib/auth-client"

export function App() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-muted-foreground">Carregando…</p>
      </main>
    )
  }

  if (!session) {
    return <AuthPanel />
  }

  return (
    <AppShell email={session.user.email} onSignOut={() => void signOut()}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bem-vindo ao CondoPartners
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Esta é a área autenticada. Em breve: rede de partners e comissões.
        </p>
        <p className="mt-4 text-sm text-muted-foreground tabular-nums">Olá, {session.user.email}</p>
      </div>
    </AppShell>
  )
}
