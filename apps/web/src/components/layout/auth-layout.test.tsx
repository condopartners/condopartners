import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { AuthLayout } from "./auth-layout"

describe("AuthLayout", () => {
  test("mostra wordmark e tagline da marca", () => {
    const html = renderToStaticMarkup(
      <AuthLayout>
        <p>form</p>
      </AuthLayout>,
    )
    expect(html).toContain("CondoPartners")
    expect(html).toContain("Rede de partners e comissões.")
    expect(html).toContain("form")
  })
})
