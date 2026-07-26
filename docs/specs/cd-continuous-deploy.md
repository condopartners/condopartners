# CD contínuo: GHCR + deploy main→prod / dev→dev

## Status

Aprovada (issue Paperclip [SIS-198](/SIS/issues/SIS-198); plano em
[SIS-195](/SIS/issues/SIS-195)#document-plan; contexto board
[SIS-194](/SIS/issues/SIS-194))

## Issue

- Paperclip: [SIS-198](/SIS/issues/SIS-198) (parent [SIS-195](/SIS/issues/SIS-195))
- GitHub: PR desta entrega

## Resumo

CI hoje só faz `docker build` com `push: false` — build verde não publica nem
redeploya. Esta spec define CD real: push/merge em `main` publica imagens no
GHCR e redeploya o stack **prod**; push na branch **`dev`** faz o mesmo para o
stack **dev**. Tags canônicas por SHA; evidência de versão via `gitSha` em
`GET /health`.

## Escopo

- **Dentro:**
  - Spec `docs/specs/cd-continuous-deploy.md`
  - Workflow `.github/workflows/cd.yml`
  - Build-arg `GIT_SHA` nos Dockerfiles `api` / `web` / `landing`
  - Campo `gitSha` em `HealthResponse` + testes TDD
  - Runbook `deploy/README.md` + placeholders GHCR em `deploy/.env.example`
  - Documentação dos secrets Actions (sem commitá-los)
  - Branch de deploy DEV = `dev` (criar a partir de `main` se não existir)
- **Fora:**
  - Merge do PR (humano)
  - Prompt PWA de atualização (Design / [SIS-194](/SIS/issues/SIS-194))
  - Reescrever nginx/TLS
  - Rebuild-no-host como caminho primário

## Comportamento

1. **Trigger prod:** `push` em `main` → build/push GHCR + redeploy stack prod.
2. **Trigger DEV:** `push` na branch `dev` → build/push GHCR + redeploy stack
   `condopartners-dev` (hosts `app-dev` / `api-dev`).
3. **Registry / tags:**
   - Imagens: `ghcr.io/<owner>/condopartners-{api,web,landing}`
   - Tag obrigatória: `sha-<fullsha>` (40 hex do commit)
   - Tags móveis opcionais **além** do SHA: `prod` (em `main`) e `dev` (na
     branch `dev`) — nunca `:latest` como única tag publicada
4. **CI de PR:** job `docker` em `ci.yml` permanece `push: false` (gate de
   build; não publica).
5. **`GIT_SHA`:** build-arg nos 3 Dockerfiles; API propaga como `ENV GIT_SHA` e
   expõe em `GET /health` como `gitSha` (`string | null`; `null` se ausente —
   localhost/dev sem imagem CD).
6. **Redeploy no host:** job Actions com SSH:
   - `docker login ghcr.io`
   - exporta `API_IMAGE` / `WEB_IMAGE` / `LANDING_IMAGE` pinadas no SHA
   - `docker compose -f deploy/portainer/{prod|dev}.portainer.yml pull && up -d`
7. **Secrets / vars** (só GitHub Actions / host — nunca no git):
   - Secrets: `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`
   - Variable: `DEPLOY_REPO_ROOT` (path absoluto do monorepo no host)
   - `packages: write` no `GITHUB_TOKEN` do workflow (GHCR no mesmo repo)
   - Host precisa conseguir `docker pull` do GHCR (login no job de deploy)
8. **Se secret/ops faltar:** issue marcada `blocked` com owner nomeado
   (CEO/board) — não inventar secret no repo.

## Dados / API

```ts
interface HealthResponse {
  status: HealthStatus
  service: typeof APP_NAME
  timestamp: string
  database: DatabaseHealth
  gitSha: string | null
}
```

## UI

N/A (infra / API health).

## Riscos

- Secrets SSH ausentes → CD não redeploya até board configurar.
- Host sem login GHCR → `pull` falha; o job de deploy faz login com o token do
  workflow antes do compose.
- Branch `dev` precisa existir e receber pushes (fluxo documentado no runbook).
- Tags móveis `prod`/`dev` são conveniência; pin operacional = SHA.

## Plano de teste

- Testes unitários: `gitSha` em `/health` (presente / ausente).
- Testes de artefato: `cd.yml` existe; triggers `main`/`dev`; push GHCR; tags
  SHA; secrets referenciados por nome; Dockerfiles com `ARG GIT_SHA`;
  `.env.example` com placeholders `ghcr.io`.
- `bun run check` verde.
- Pós-merge (QA [SIS-199](/SIS/issues/SIS-199)): smoke 5 hosts +
  `curl …/health` mostra `gitSha` do commit publicado.

## Refs

- Plano: [SIS-195 plan](/SIS/issues/SIS-195#document-plan)
- Infra (CD estava fora): [`infra-docker-nginx-portainer.md`](./infra-docker-nginx-portainer.md)
- CI: `.github/workflows/ci.yml`
- Stacks: `deploy/portainer/*.portainer.yml`
