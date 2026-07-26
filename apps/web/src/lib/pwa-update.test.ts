import { describe, expect, test } from "bun:test"
import {
  applyAppUpdate,
  dismissAppUpdate,
  isAppUpdateDismissed,
  PWA_UPDATE_DISMISS_KEY,
  PWA_UPDATE_TIMEOUT_MS,
  shouldShowAppUpdateBanner,
} from "./pwa-update"

function memoryStorage(): Storage {
  const map = new Map<string, string>()
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

describe("pwa-update", () => {
  test("shouldShowAppUpdateBanner só com needRefresh e sem dismiss", () => {
    expect(shouldShowAppUpdateBanner(true, false)).toBe(true)
    expect(shouldShowAppUpdateBanner(true, true)).toBe(false)
    expect(shouldShowAppUpdateBanner(false, false)).toBe(false)
  })

  test("dismiss grava sessionStorage e isDismissed lê a flag", () => {
    const storage = memoryStorage()
    expect(isAppUpdateDismissed(storage)).toBe(false)
    dismissAppUpdate(storage)
    expect(storage.getItem(PWA_UPDATE_DISMISS_KEY)).toBe("1")
    expect(isAppUpdateDismissed(storage)).toBe(true)
  })

  test("applyAppUpdate chama updateServiceWorker(true) e retorna ok", async () => {
    const calls: Array<boolean | undefined> = []
    const result = await applyAppUpdate((reloadPage) => {
      calls.push(reloadPage)
    })
    expect(calls).toEqual([true])
    expect(result).toBe("ok")
  })

  test("applyAppUpdate retorna error quando update rejeita", async () => {
    const result = await applyAppUpdate(async () => {
      throw new Error("fail")
    })
    expect(result).toBe("error")
  })

  test("applyAppUpdate retorna error no timeout", async () => {
    expect(PWA_UPDATE_TIMEOUT_MS).toBe(15_000)
    const result = await applyAppUpdate(() => new Promise(() => undefined), {
      timeoutMs: 5,
      raceTimeout: (ms) =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`timeout ${ms}`)), ms)
        }),
    })
    expect(result).toBe("error")
  })
})
