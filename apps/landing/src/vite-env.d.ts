/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_PATH?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_CONTACT_URL?: string
  readonly VITE_WAITLIST_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
