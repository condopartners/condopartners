import { useEffect } from "react"
import { AdminUsersPage } from "@/components/admin/admin-users-page"
import { AuthPanel } from "@/components/auth/auth-panel"
import { AppShell } from "@/components/layout/app-shell"
import { signOut, useSession } from "@/lib/auth-client"

export function App() {
  const { data: session, isPending } = useSession()

  const isAdminRoute = window.location.pathname.startsWith("/admin")
  const isAdmin = session?.user.role === "admin"

  // Gate de UI (spec super-admin): /admin só para role admin; demais voltam ao início.
  const shouldRedirect = !isPending && session != null && isAdminRoute && !isAdmin
  useEffect(() => {
    if (shouldRedirect) {
      window.location.replace("/")
    }
  }, [shouldRedirect])

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

  if (shouldRedirect) {
    return null
  }

  if (isAdminRoute) {
    return (
      <AppShell
        email={session.user.email}
        onSignOut={() => void signOut()}
        title="Admin"
        isAdmin={isAdmin}
      >
        <AdminUsersPage />
      </AppShell>
    )
  }

  return (
    <AppShell email={session.user.email} onSignOut={() => void signOut()} isAdmin={isAdmin}>
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
