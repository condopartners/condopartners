import { describe, expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { PWA_UPDATE_DISMISS_KEY } from "@/lib/pwa-update"
import { AppUpdateRoot } from "./app-update-root"

function memoryStorage(initial?: Record<string, string>): Storage {
  const map = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key) {
      return map.get(key) ?? null
    },
    setItem(key, value) {
      map.set(key, String(value))
    },
    removeItem(key) {
      map.delete(key)
    },
    key(index) {
      return [...map.keys()][index] ?? null
    },
  }
}

describe("AppUpdateRoot", () => {
  test("não renderiza sem needRefresh", () => {
    const html = renderToStaticMarkup(
      <AppUpdateRoot
        needRefresh={false}
        updateServiceWorker={() => undefined}
        storage={memoryStorage()}
      />,
    )
    expect(html).toBe("")
  })

  test("renderiza banner quando needRefresh e sem dismiss", () => {
    const html = renderToStaticMarkup(
      <AppUpdateRoot needRefresh updateServiceWorker={() => undefined} storage={memoryStorage()} />,
    )
    expect(html).toContain("Nova versão disponível")
  })

  test("não renderiza se dismiss já está na sessão", () => {
    const html = renderToStaticMarkup(
      <AppUpdateRoot
        needRefresh
        updateServiceWorker={() => undefined}
        storage={memoryStorage({ [PWA_UPDATE_DISMISS_KEY]: "1" })}
      />,
    )
    expect(html).toBe("")
  })
})
