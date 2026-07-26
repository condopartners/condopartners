import { useRegisterSW } from "virtual:pwa-register/react"
import { AppUpdateRoot } from "./app-update-root"

export function AppUpdateBridge() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return <AppUpdateRoot needRefresh={needRefresh} updateServiceWorker={updateServiceWorker} />
}
