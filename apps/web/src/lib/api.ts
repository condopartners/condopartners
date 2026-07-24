import type { App } from "@condopartners/api"
import { treaty } from "@elysiajs/eden"

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export const api = treaty<App>(apiBaseUrl)
