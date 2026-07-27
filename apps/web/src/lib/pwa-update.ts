export const PWA_UPDATE_DISMISS_KEY = "cp.pwaUpdate.dismissed"
export const PWA_UPDATE_TIMEOUT_MS = 15_000

export function shouldShowAppUpdateBanner(needRefresh: boolean, dismissed: boolean): boolean {
  return needRefresh && !dismissed
}

export function isAppUpdateDismissed(storage: Storage = sessionStorage): boolean {
  return storage.getItem(PWA_UPDATE_DISMISS_KEY) === "1"
}

export function dismissAppUpdate(storage: Storage = sessionStorage): void {
  storage.setItem(PWA_UPDATE_DISMISS_KEY, "1")
}

export type ApplyAppUpdateOptions = {
  timeoutMs?: number
  raceTimeout?: (ms: number) => Promise<never>
}

export async function applyAppUpdate(
  updateServiceWorker: (reloadPage?: boolean) => void | Promise<void>,
  options: ApplyAppUpdateOptions = {},
): Promise<"ok" | "error"> {
  const timeoutMs = options.timeoutMs ?? PWA_UPDATE_TIMEOUT_MS
  const timeout =
    options.raceTimeout?.(timeoutMs) ??
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), timeoutMs)
    })

  try {
    await Promise.race([Promise.resolve(updateServiceWorker(true)), timeout])
    return "ok"
  } catch {
    return "error"
  }
}
