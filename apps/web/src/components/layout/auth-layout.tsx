import { APP_NAME } from "@condopartners/shared"
import type { ReactNode } from "react"

const TAGLINE = "Rede de partners e comissões."

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside
        className="flex shrink-0 flex-col justify-center bg-[var(--cp-ink)] px-6 py-8 text-[var(--cp-primary-fg)] lg:w-[42%] lg:px-10 lg:py-12"
        aria-label="Marca CondoPartners"
      >
        <p className="text-xl font-bold tracking-tight">{APP_NAME}</p>
        <p className="mt-2 max-w-sm text-sm text-white/80">{TAGLINE}</p>
      </aside>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}
