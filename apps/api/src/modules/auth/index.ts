import { Elysia } from "elysia"
import { auth } from "../../auth/auth"

export const authModule = new Elysia({ name: "auth" }).all("/api/auth/*", ({ request }) =>
  auth.handler(request),
)
