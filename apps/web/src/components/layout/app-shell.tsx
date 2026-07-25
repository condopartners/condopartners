import { type ReactNode, useEffect, useId, useState } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { cn } from "@/lib/utils"

type AppShellProps = {
  email: string
  onSignOut: () => void
  children: ReactNode
  title?: string
}

export function AppShell({ email, onSignOut, children, title = "Início" }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerTitleId = useId()
  const mainId = "conteudo-principal"

  useEffect(() => {
    if (!menuOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-screen bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      <a
        href={`#${mainId}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-[var(--radius)] focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow focus:ring-2 focus:ring-ring"
      >
        Ir para o conteúdo
      </a>

      <aside
        className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col"
        aria-label="Navegação"
      >
        <AppSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title={title}
          email={email}
          onSignOut={onSignOut}
          showMenuButton
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main id={mainId} className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1120px]">{children}</div>
        </main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--cp-ink)]/40"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className={cn(
              "cp-drawer absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-card shadow-[0_1px_2px_rgb(11_31_51_/_0.06)]",
              "overscroll-contain",
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
          >
            <p id={drawerTitleId} className="sr-only">
              Menu de navegação
            </p>
            <p className="truncate border-b border-border px-5 py-3 text-sm text-muted-foreground tabular-nums">
              {email}
            </p>
            <AppSidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  )
}
