import { app } from "./app"
import { assertSmtpEnvForProduction } from "./lib/mailer"

assertSmtpEnvForProduction()

const port = Number(process.env.API_PORT ?? 3000)
const hostname = process.env.API_HOST ?? "0.0.0.0"

app.listen({ port, hostname }, () => {
  console.log(`API listening on http://${hostname}:${port}`)
})
