import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { AppShell } from "./app-shell"

describe("AppShell", () => {
  test("expõe skip link, Início, e-mail, Sair e home placeholder", () => {
    const html = renderToStaticMarkup(
      <AppShell email="ops@empresa.com" onSignOut={() => undefined}>
        <h1>Bem-vindo ao CondoPartners</h1>
        <p>Esta é a área autenticada. Em breve: rede de partners e comissões.</p>
      </AppShell>,
    )
    expect(html).toContain("Ir para o conteúdo")
    expect(html).toContain("Início")
    expect(html).toContain("ops@empresa.com")
    expect(html).toContain("Sair")
    expect(html).toContain('aria-label="Abrir menu"')
    expect(html).toContain("Bem-vindo ao CondoPartners")
    expect(html).not.toContain('href="/admin"')
  })

  test("exibe navegação Admin quando o servidor autoriza a sessão", () => {
    const html = renderToStaticMarkup(
      <AppShell email="ops@empresa.com" onSignOut={() => undefined} isAdmin>
        <h1>Usuários</h1>
      </AppShell>,
    )

    expect(html).toContain('href="/admin"')
  })
})
