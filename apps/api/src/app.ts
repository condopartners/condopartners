import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia"
import { healthModule } from "./modules/health"

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .use(healthModule)

export type App = typeof app
