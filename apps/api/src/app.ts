import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia"
import { authModule } from "./modules/auth"
import { healthModule } from "./modules/health"

const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

export const app = new Elysia()
  .use(
    cors({
      origin: webOrigin,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(authModule)
  .use(healthModule)

export type App = typeof app
