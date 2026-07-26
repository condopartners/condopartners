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

  test("todos os Dockerfiles copiam package.json de apps/* e packages/* antes do frozen install (SIS-46)", () => {
    const appWorkspaces = ["api", "web", "landing"]
    const packageWorkspaces = ["shared"]
    for (const app of appWorkspaces) {
      const body = read(join(root, "apps", app, "Dockerfile"))
      const depsStage = body.slice(0, body.indexOf("--frozen-lockfile"))
      for (const ws of appWorkspaces) {
        expect(
          depsStage.includes(`COPY apps/${ws}/package.json`),
          `${app}/Dockerfile deps stage must COPY apps/${ws}/package.json`,
        ).toBe(true)
      }
      for (const ws of packageWorkspaces) {
        expect(
          depsStage.includes(`COPY packages/${ws}/package.json`),
          `${app}/Dockerfile deps stage must COPY packages/${ws}/package.json`,
        ).toBe(true)
      }
    }
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

  test("overlays Portainer image-based sem build e sem binds relativos (SIS-99)", () => {
    for (const name of ["prod.portainer.yml", "dev.portainer.yml"]) {
      const path = join(deploy, "portainer", name)
      expect(existsSync(path), path).toBe(true)
      const raw = read(path)
      const doc = parseYaml(raw) as {
        services: Record<string, Record<string, unknown>>
      }

      const required = ["api", "web", "landing", "postgres", "nginx"]
      for (const svc of required) {
        expect(doc.services[svc], `${name} missing ${svc}`).toBeDefined()
        expect(doc.services[svc].restart).toBe("unless-stopped")
        // image-based: no build context (Portainer CE Git/string sem monorepo)
        expect(doc.services[svc].build, `${name} ${svc} must not use build:`).toBeUndefined()
        expect(typeof doc.services[svc].image).toBe("string")
      }

      const postgres = doc.services.postgres
      expect(JSON.stringify(postgres.healthcheck)).toContain("pg_isready")
      const ports = postgres.ports as unknown[] | undefined
      expect(ports == null || ports.length === 0).toBe(true)

      const api = doc.services.api
      expect(JSON.stringify(api.healthcheck)).toContain("/health")

      // binds relativos (`../nginx`) quebram sob /data/compose no Portainer Git
      const volumeLines = raw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- ") && l.includes(":/"))
      expect(volumeLines.some((l) => l.includes("../"))).toBe(false)
      expect(raw).toMatch(/\$\{DEPLOY_ROOT/)
      expect(raw).toMatch(/POSTGRES_PASSWORD:\s*\$\{/)
    }

    const prod = read(join(deploy, "portainer", "prod.portainer.yml"))
    const dev = read(join(deploy, "portainer", "dev.portainer.yml"))
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
      "app-dev.condopartners.com.br",
      "api-dev.condopartners.com.br",
    ]
    for (const host of hosts) {
      expect(concatenated.includes(host), `missing host ${host}`).toBe(true)
    }

    // Legacy multi-level *.dev hosts abandoned (Universal SSL / SIS-114)
    expect(concatenated).not.toMatch(/app\.dev\.condopartners\.com\.br/)
    expect(concatenated).not.toMatch(/api\.dev\.condopartners\.com\.br/)

    for (const header of ["X-Real-IP", "X-Forwarded-For", "X-Forwarded-Proto", "Host"]) {
      expect(concatenated).toContain(header)
    }

    expect(concatenated).toMatch(/listen\s+443/)
    expect(concatenated).toMatch(/ssl_certificate/)
    expect(concatenated).toMatch(/return\s+301\s+https/)
  })

  test("edge host vendorado roteia app-dev/api-dev para cp_dev (SIS-114)", () => {
    const edgePath = join(deploy, "nginx", "edge", "condopartners-edge.conf")
    expect(existsSync(edgePath), edgePath).toBe(true)
    const edge = read(edgePath)

    expect(edge).toMatch(/upstream\s+cp_prod/)
    expect(edge).toMatch(/upstream\s+cp_dev/)
    expect(edge).toMatch(/map\s+\$host\s+\$cp_upstream/)
    expect(edge).toMatch(/app-dev\.condopartners\.com\.br\s+cp_dev/)
    expect(edge).toMatch(/api-dev\.condopartners\.com\.br\s+cp_dev/)
    expect(edge).toContain("server_name")
    expect(edge).toContain("app-dev.condopartners.com.br")
    expect(edge).toContain("api-dev.condopartners.com.br")
    expect(edge).not.toMatch(/app\.dev\.condopartners\.com\.br/)
    expect(edge).not.toMatch(/api\.dev\.condopartners\.com\.br/)
  })

  test("env.example e README usam FQDNs canônicos app-dev/api-dev", () => {
    const envExample = read(join(deploy, ".env.example"))
    expect(envExample).toContain("DOMAIN_WEB_DEV=app-dev.condopartners.com.br")
    expect(envExample).toContain("DOMAIN_API_DEV=api-dev.condopartners.com.br")
    expect(envExample).toContain("https://api-dev.condopartners.com.br")
    expect(envExample).not.toMatch(/api\.dev\.condopartners/)
    expect(envExample).not.toMatch(/app\.dev\.condopartners/)

    const readme = read(join(deploy, "README.md"))
    expect(readme).toContain("app-dev.condopartners.com.br")
    expect(readme).toContain("api-dev.condopartners.com.br")
    expect(readme).toMatch(/edge|condopartners-edge/i)
    expect(readme).not.toMatch(/app\.dev\.condopartners\.com\.br/)
    expect(readme).not.toMatch(/api\.dev\.condopartners\.com\.br/)
  })

  test("spec CORS documenta hosts canônicos app-dev/api-dev (SIS-102)", () => {
    const corsSpec = read(join(root, "docs/specs/prod-cors-admin-access.md"))
    expect(corsSpec).toContain("https://app-dev.condopartners.com.br")
    expect(corsSpec).toContain("https://api-dev.condopartners.com.br")
    expect(corsSpec).not.toMatch(/https:\/\/app\.dev\.condopartners/)
    expect(corsSpec).not.toMatch(/https:\/\/api\.dev\.condopartners/)
  })

  test("CI exercita docker build das 3 imagens com cache (SIS-48)", () => {
    const workflowPath = join(root, ".github", "workflows", "ci.yml")
    expect(existsSync(workflowPath), workflowPath).toBe(true)
    const workflow = read(workflowPath)
    const doc = parseYaml(workflow) as {
      jobs?: Record<string, unknown>
    }

    expect(doc.jobs?.docker, "job `docker` missing in ci.yml").toBeDefined()
    const dockerJob = JSON.stringify(doc.jobs?.docker)

    expect(dockerJob).toMatch(/docker\/setup-buildx-action@/)
    expect(dockerJob).toMatch(/docker\/build-push-action@/)
    expect(dockerJob).toContain("apps/api/Dockerfile")
    expect(dockerJob).toContain("apps/web/Dockerfile")
    expect(dockerJob).toContain("apps/landing/Dockerfile")
    expect(dockerJob).toContain("VITE_API_URL=https://api.example.com")
    expect(dockerJob).toMatch(/type=gha/)
    expect(dockerJob).not.toMatch(/password|secret|token|api[_-]?key/i)
    expect(dockerJob).toMatch(/"push":false/)
  })

  test("stacks e overlays Portainer passam WEB_ORIGIN e Better Auth ao api (SIS-117)", () => {
    const requiredApiEnv = ["WEB_ORIGIN", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET"]
    for (const name of [
      "prod.stack.yml",
      "dev.stack.yml",
      "prod.portainer.yml",
      "dev.portainer.yml",
    ]) {
      const path = join(deploy, "portainer", name)
      expect(existsSync(path), path).toBe(true)
      const doc = parseYaml(read(path)) as {
        services: Record<string, { environment?: Record<string, string> }>
      }
      const apiEnv = doc.services.api?.environment ?? {}
      for (const key of requiredApiEnv) {
        expect(apiEnv[key], `${name} api.environment missing ${key}`).toBe(`\${${key}}`)
      }
    }
  })

  test("stacks prod passam NODE_ENV=production ao api (SIS-123)", () => {
    for (const name of ["prod.stack.yml", "prod.portainer.yml"]) {
      const path = join(deploy, "portainer", name)
      const doc = parseYaml(read(path)) as {
        services: Record<string, { environment?: Record<string, string> }>
      }
      expect(
        doc.services.api?.environment?.NODE_ENV,
        `${name} api.environment missing NODE_ENV=production`,
      ).toBe("production")
    }
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
      "WEB_ORIGIN",
      "BETTER_AUTH_URL",
      "BETTER_AUTH_SECRET",
      "CERTBOT_EMAIL",
      "DEPLOY_ROOT",
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
    // SIS-99: runbook deve explicar image-based (Portainer) vs build-no-stack
    expect(readme).toMatch(/\.portainer\.yml/)
    expect(readme.toLowerCase()).toMatch(/image-based|imagens pré-buildadas|imagens pre-buildadas/)
    expect(readme).toMatch(/DEPLOY_ROOT/)
  })
})
