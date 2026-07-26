import { useState } from "react"
import {
  applyAppUpdate,
  dismissAppUpdate,
  isAppUpdateDismissed,
  shouldShowAppUpdateBanner,
} from "@/lib/pwa-update"
import { AppUpdateBanner, type AppUpdateBannerStatus } from "./app-update-banner"

export type AppUpdateRootProps = {
  needRefresh: boolean
  updateServiceWorker: (reloadPage?: boolean) => void | Promise<void>
  storage?: Storage
}

export function AppUpdateRoot({
  needRefresh,
  updateServiceWorker,
  storage = sessionStorage,
}: AppUpdateRootProps) {
  const [dismissed, setDismissed] = useState(() => isAppUpdateDismissed(storage))
  const [status, setStatus] = useState<AppUpdateBannerStatus>("available")

  if (!shouldShowAppUpdateBanner(needRefresh, dismissed)) {
    return null
  }

  return (
    <AppUpdateBanner
      status={status}
      onDismiss={() => {
        dismissAppUpdate(storage)
        setDismissed(true)
      }}
      onUpdate={() => {
        setStatus("updating")
        void applyAppUpdate(updateServiceWorker).then((result) => {
          if (result === "error") {
            setStatus("error")
          }
        })
      }}
    />
  )
}
