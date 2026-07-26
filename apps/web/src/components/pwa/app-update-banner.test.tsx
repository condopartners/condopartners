import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { AppUpdateBanner } from "./app-update-banner"

describe("AppUpdateBanner", () => {
  test("estado disponível: copy recomendada, a11y e CTAs", () => {
    const html = renderToStaticMarkup(
      <AppUpdateBanner status="available" onUpdate={() => undefined} onDismiss={() => undefined} />,
    )
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-live="polite"')
    expect(html).toContain('aria-label="Aviso de atualização do aplicativo"')
    expect(html).toContain("Nova versão disponível")
    expect(html).toContain(
      "Há uma atualização do CondoPartners. Atualize para usar a versão mais recente.",
    )
    expect(html).toContain("Atualizar agora")
    expect(html).toContain("Agora não")
    expect(html).toContain("fixed")
    expect(html).toContain("safe-area-inset-bottom")
  })

  test("estado atualizando: CTAs desabilitados e label Atualizando…", () => {
    const html = renderToStaticMarkup(
      <AppUpdateBanner status="updating" onUpdate={() => undefined} onDismiss={() => undefined} />,
    )
    expect(html).toContain("Atualizando…")
    expect(html).toContain("disabled")
    expect(html).not.toContain("Atualizar agora")
  })

  test("estado falha: copy de erro e retry disponível", () => {
    const html = renderToStaticMarkup(
      <AppUpdateBanner status="error" onUpdate={() => undefined} onDismiss={() => undefined} />,
    )
    expect(html).toContain("Não foi possível atualizar. Tente de novo.")
    expect(html).toContain("Atualizar agora")
    expect(html).toContain("Agora não")
  })
})
