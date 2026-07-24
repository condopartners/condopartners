import { describe, expect, test } from "bun:test"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = join(import.meta.dir, "..")
const deploy = join(root, "deploy")

function read(path: string): string {
  return readFileSync(path, "utf8")
}

function parseYaml(text: string): unknown {
  return Bun.YAML.parse(text)
}

describe("deploy artifacts (SIS-39)", () => {
  test("Dockerfiles multi-stage existem para api, web e landing", () => {
    for (const app of ["api", "web", "landing"]) {
      const path = join(root, "apps", app, "Dockerfile")
      expect(existsSync(path), path).toBe(true)
      const body = read(path)
      expect(body).toMatch(/FROM\s+oven\/bun/i)
      expect(body.match(/^FROM\s+/gim)?.length ?? 0).toBeGreaterThanOrEqual(2)
    }
  })

  test("apps/landing tem package.json exigido pelo docker build (SIS-44)", () => {
    const pkg = join(root, "apps", "landing", "package.json")
    expect(existsSync(pkg), pkg).toBe(true)
    const name = (JSON.parse(read(pkg)) as { name?: string }).name
    expect(name).toBe("@condopartners/landing")
  })

  test("stacks Portainer prod e dev têm serviços, healthchecks e isolamento", () => {
    for (const name of ["prod.stack.yml", "dev.stack.yml"]) {
      const path = join(deploy, "portainer", name)
      expect(existsSync(path), path).toBe(true)
      const doc = parseYaml(read(path)) as {
        services: Record<string, Record<string, unknown>>
        volumes?: Record<string, unknown>
        networks?: Record<string, unknown>
      }
      const required = ["api", "web", "landing", "postgres", "nginx"]
      for (const svc of required) {
        expect(doc.services[svc], `${name} missing ${svc}`).toBeDefined()
      }

      const postgres = doc.services.postgres
      expect(postgres.healthcheck).toBeDefined()
      expect(JSON.stringify(postgres.healthcheck)).toContain("pg_isready")
      expect(postgres.volumes).toBeDefined()
      // Prod/dev must not publish Postgres publicly
      const ports = postgres.ports as unknown[] | undefined
      expect(ports == null || ports.length === 0).toBe(true)

      const api = doc.services.api
      expect(api.healthcheck).toBeDefined()
      expect(JSON.stringify(api.healthcheck)).toContain("/health")
      expect(api.restart).toBe("unless-stopped")

      for (const svc of required) {
        expect(doc.services[svc].restart).toBe("unless-stopped")
      }

      const raw = read(path)
      expect(raw).not.toMatch(
        /POSTGRES_PASSWORD:\s*['"]?(?!\$\{)(?!change)(?!REPLACE)(?!<.*>)[a-zA-Z0-9]{8,}/,
      )
      // no hardcoded password literals — must use env interpolation
      expect(raw).toMatch(/POSTGRES_PASSWORD:\s*\$\{/)
    }

    const prod = read(join(deploy, "portainer", "prod.stack.yml"))
    const dev = read(join(deploy, "portainer", "dev.stack.yml"))
    expect(dev).toMatch(/-dev/)
    expect(prod).not.toEqual(dev)
  })

  test("nginx cobre os 5 hosts com proxy headers e TLS preparado", () => {
    const nginxDir = join(deploy, "nginx")
    expect(existsSync(nginxDir)).toBe(true)

    const files = readdirSync(nginxDir, { recursive: true, encoding: "utf8" }) as string[]
    const concatenated = files
      .filter((f) => f.endsWith(".conf"))
      .map((f) => read(join(nginxDir, f)))
      .join("\n")

    const hosts = [
      "condopartners.com.br",
      "www.condopartners.com.br",
      "app.condopartners.com.br",
      "api.condopartners.com.br",
      "app.dev.condopartners.com.br",
      "api.dev.condopartners.com.br",
    ]
    for (const host of hosts) {
      expect(concatenated.includes(host), `missing host ${host}`).toBe(true)
    }

    for (const header of ["X-Real-IP", "X-Forwarded-For", "X-Forwarded-Proto", "Host"]) {
      expect(concatenated).toContain(header)
    }

    expect(concatenated).toMatch(/listen\s+443/)
    expect(concatenated).toMatch(/ssl_certificate/)
    expect(concatenated).toMatch(/return\s+301\s+https/)
  })

  test("runbook, env.example e dockerignore existem sem secrets", () => {
    expect(existsSync(join(deploy, "README.md"))).toBe(true)
    expect(existsSync(join(deploy, ".env.example"))).toBe(true)
    expect(existsSync(join(root, ".dockerignore"))).toBe(true)

    const envExample = read(join(deploy, ".env.example"))
    for (const key of [
      "POSTGRES_DB",
      "POSTGRES_USER",
      "POSTGRES_PASSWORD",
      "DATABASE_URL",
      "API_PORT",
      "API_HOST",
      "VITE_API_URL",
      "CERTBOT_EMAIL",
    ]) {
      expect(envExample.includes(key), `missing ${key}`).toBe(true)
    }

    // placeholders only — no obvious real secrets
    expect(envExample).not.toMatch(/sk_live|ghp_[A-Za-z0-9]|xoxb-/)
    expect(envExample.toLowerCase()).toMatch(/change-me|replace|example|your-|<.*>|xxx/)

    const gitignore = read(join(root, ".gitignore"))
    expect(gitignore).toMatch(/\.env/)

    const readme = read(join(deploy, "README.md"))
    expect(readme.toLowerCase()).toMatch(/portainer/)
    expect(readme.toLowerCase()).toMatch(/landing/)
    expect(readme.toLowerCase()).toMatch(/tls|certbot|let'?s encrypt/)
  })
})
