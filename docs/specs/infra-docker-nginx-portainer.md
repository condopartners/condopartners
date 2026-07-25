# Infra: Artefatos Docker / nginx / Portainer (prod + dev)

## Status

Aprovada (issue SIS-39 aprovada pelo board; infra sem schema de domínio)

## Issue

SIS-39 (parent SIS-38)

## Resumo

Entregar no monorepo os artefatos para rodar **prod** e **dev** do CondoPartners
via **Portainer CE**: Dockerfiles multi-stage para `apps/api`, `apps/web` e
`apps/landing`; stacks compose (prod + dev) importáveis no Portainer; nginx como
reverse proxy cobrindo os 5 hostnames; runbook de import; e `.env.example` de
deploy sem secrets. Nenhuma tabela de domínio é criada.

## Escopo

- **Dentro:**
  - Dockerfiles multi-stage: `apps/api/Dockerfile`, `apps/web/Dockerfile`,
    `apps/landing/Dockerfile`.
  - Stacks Portainer-ready: `deploy/portainer/prod.stack.yml` e
    `deploy/portainer/dev.stack.yml` (serviços: api, web, landing, postgres, nginx).
  - Config nginx: `deploy/nginx/` com vhosts + reverse proxy dos 5 hosts e
    preparo de TLS (Let's Encrypt via companion `certbot` OU hooks documentados).
  - Runbook: `deploy/README.md` (import no Portainer CE: env, volumes, healthchecks, TLS).
  - `.env.example` de deploy sem secrets: `deploy/.env.example`.
  - `.dockerignore` na raiz e/ou por app.
  - PR único aberto (humanos mergeiam).
- **Fora:**
  - Provisionamento do host, DNS, criação real de certificados TLS.
  - Tabelas/migrations de domínio (só a infra de Postgres, sem schema novo).
  - CI/CD de deploy automático (só artefatos + runbook).
  - Billing/integrações.

## Hosts-alvo (nginx)

| Host | Upstream | Ambiente |
|------|----------|----------|
| `condopartners.com.br` (+ `www`) | landing | prod |
| `app.condopartners.com.br` | web | prod |
| `api.condopartners.com.br` | api | prod |
| `app-dev.condopartners.com.br` | web (dev) | dev |
| `api-dev.condopartners.com.br` | api (dev) | dev |

> **Hosts dev (SIS-97 / SIS-114):** abandonamos `app.dev` / `api.dev` (Universal
> SSL Cloudflare não cobre `*.dev.*`). Canônicos: `app-dev` / `api-dev` (um
> nível sob o apex). Edge host: `deploy/nginx/edge/condopartners-edge.conf`.

> **Nota (alinhar no PR/runbook):** a spec da landing hoje aponta para GitHub
> Pages. Aqui o board pediu container no domínio próprio. O runbook deve deixar
> explícito que este stack passa a servir a landing via container em
> `condopartners.com.br` e como conviver/migrar do Pages.

## Comportamento (critérios de aceite testáveis)

1. **Dockerfiles multi-stage** para os 3 apps, cada um:
   - Usa `oven/bun` como base (o repo roda em Bun).
   - Estágio de build separado do runtime; imagem final enxuta.
   - `apps/api`: instala deps do workspace, roda a API com `bun run src/index.ts`
     respeitando `API_PORT`/`API_HOST`; expõe `3000`.
   - `apps/web` e `apps/landing`: `vite build` no estágio de build; runtime serve
     os estáticos com nginx (ou `bun`/servidor estático) — decidir e documentar.
   - Build funciona a partir da raiz do monorepo (contexto = raiz; workspaces Bun).
2. **Stacks Portainer-ready** (`prod.stack.yml`, `dev.stack.yml`):
   - Serviços: `api`, `web`, `landing`, `postgres`, `nginx`.
   - Variáveis via `environment`/`env_file` (sem valores secretos hardcoded).
   - `postgres` com volume nomeado persistente e `healthcheck` (`pg_isready`).
   - `api` com `healthcheck` batendo em `/health` (endpoint já existe).
   - `restart: unless-stopped` nos serviços de longa duração.
   - Dev e prod isolados (nomes de rede/volume/porta distintos; sufixo `-dev`).
   - Compatível com o "Add stack" do Portainer CE (build de imagem OU imagens
     pré-buildadas — decidir e documentar; se build, `build.context`/`dockerfile`
     válidos).
3. **nginx** (`deploy/nginx/`):
   - Um server block por host da tabela acima, com `proxy_pass` para o upstream.
   - Headers de proxy padrão (`Host`, `X-Real-IP`, `X-Forwarded-For`,
     `X-Forwarded-Proto`).
   - TLS preparado: template `:443` + redirect `:80`→`:443`, com Let's Encrypt
     (`certbot`) OU hooks/documentação de como plugar certificados. Sem cert real
     versionado.
   - `nginx -t` passa (validação de sintaxe) contra a config gerada.
4. **Runbook** (`deploy/README.md`): passo-a-passo de import no Portainer CE —
   env vars necessárias, volumes, healthchecks, ordem de subida, TLS, e a nota
   da landing.
5. **`deploy/.env.example`**: todas as variáveis de deploy (POSTGRES_*,
   DATABASE_URL, API_PORT/HOST, VITE_API_URL por ambiente, domínios, e-mail do
   certbot) com **placeholders**, zero secrets reais.
6. **PR único** aberto em pt-BR (template do repo), linkando esta spec e SIS-39.

## Dados / API

Sem novos contratos de API. Reusa o endpoint `/health` existente para healthcheck.

## Segurança / Restrições

- **Sem secrets no git** — só `.env.example` com placeholders; `.env` de deploy
  fica fora do repo (verificar `.gitignore`).
- Senha de Postgres **não** hardcoded nos stacks; vem de env no Portainer.
- Dinheiro em centavos se qualquer valor aparecer (não deve aparecer aqui).
- Não inventar schema de domínio; Postgres sobe vazio (migrations rodam à parte).
- Não expor Postgres publicamente em prod (sem `ports` público; só rede interna).

## Plano de teste (evidência exigida — QA)

- `bun run check` **verde** se o PR tocar código TS (provavelmente não toca, mas
  confirmar que não quebrou nada).
- `docker build` de cada Dockerfile a partir da raiz **conclui** (ou, se ambiente
  sem Docker, revisão manual + `hadolint`/lint de Dockerfile documentado).
- `nginx -t` na config (via container `nginx` ou `docker run --rm nginx nginx -t`).
- Validar YAML dos stacks (`docker compose -f <stack> config` OU parser YAML).
- Checklist manual: os 5 hostnames têm server block e upstream corretos; nenhum
  secret real commitado (`git grep` por padrões óbvios); volumes/healthchecks
  presentes.
- Runbook revisável: um humano consegue seguir o import no Portainer CE.

## Riscos

- Portainer CE "Add stack" tem limitações de build/context — validar se usaremos
  build no stack ou imagens pré-buildadas (registry). Documentar a escolha.
- Landing migrando de Pages → container: possível conflito de DNS/host; alinhar
  no runbook.
- TLS/Let's Encrypt depende do host e DNS reais (fora do escopo de código);
  entregar preparado, não emitido.
