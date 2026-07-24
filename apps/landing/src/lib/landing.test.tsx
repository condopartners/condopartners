import { describe, expect, it } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { App } from "../App"
import { comoFunciona, duvidas, hero, paraQuem, problema, waitlistSection } from "./copy"

describe("landing page smoke", () => {
  const html = renderToStaticMarkup(<App />)

  it("renders brand CondoPartners at hero level and canonical headline", () => {
    expect(html).toContain("CondoPartners")
    expect(html).toContain(hero.headline)
  })

  it("renders required sections in document order", () => {
    const ids = [
      problema.id,
      comoFunciona.id,
      paraQuem.id,
      duvidas.id,
      waitlistSection.id,
      "contato",
    ]
    let last = -1
    for (const id of ids) {
      const idx = html.indexOf(`id="${id}"`)
      expect(idx).toBeGreaterThan(last)
      last = idx
    }
  })

  it("exposes both CTAs and waitlist email field", () => {
    expect(html).toContain("Entrar na lista de espera")
    expect(html).toContain("Fale conosco")
    expect(html).toContain('type="email"')
    expect(html).toContain("Quero acesso antecipado")
  })
})
