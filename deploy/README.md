# Deploy — Portainer CE (prod + dev)

Artefatos para subir CondoPartners em host com **Portainer CE**, conforme
[`docs/specs/infra-docker-nginx-portainer.md`](../docs/specs/infra-docker-nginx-portainer.md).

## Escolha: image-based (Portainer) vs build-no-stack

| Caminho | Arquivos | Quando usar |
|---------|----------|-------------|
| **image-based** (recomendado no Portainer CE) | `deploy/portainer/*.portainer.yml` | Import no Portainer (Git / Web editor / string). Sem `build:`; binds nginx **absolutos** via `DEPLOY_ROOT`. |
| **build-no-stack** | `deploy/portainer/*.stack.yml` | Build local no host com contexto do monorepo (`docker compose -f … build`). |

### Por que o overlay image-based existe (SIS-99)

No Portainer CE, o método **Git** resolve binds relativos (`../nginx/…`) sob
`/data/compose/…` para paths inválidos. O método **string** + `build:` também
falha sem o monorepo montado. Os overlays `*.portainer.yml` evitam os dois:

- `image:` com tags locais (ou registry) — build fora do Portainer
- volumes nginx com `${DEPLOY_ROOT}/nginx/…` (absoluto no host Docker)

### Build das imagens (antes do Portainer)

No checkout do monorepo no host:

```bash
# prod
docker compose -p condopartners-prod \
  --env-file deploy/.env.prod \
  -f deploy/portainer/prod.stack.yml build

# dev
docker compose -p condopartners-dev \
  --env-file deploy/.env.dev \
  -f deploy/portainer/dev.stack.yml build
```

Defaults do overlay: `condopartners-prod-api|web|landing:latest` (e `-dev-` no
stack dev). Override com `API_IMAGE` / `WEB_IMAGE` / `LANDING_IMAGE`.

## Pré-requisitos

- Host com Docker + Portainer CE
- DNS dos hosts apontando para o host (prod/dev conforme a tabela da spec)
- Arquivo de env preenchido (veja abaixo)
- Código de `apps/landing` presente no branch (PR da landing) para build da
  imagem `landing`

## Variáveis de ambiente

1. Copie `deploy/.env.example` → `deploy/.env.prod` / `deploy/.env.dev` (local)
   **ou** cole as mesmas chaves no editor de env do Portainer ao criar o stack.
2. Preencha `POSTGRES_PASSWORD` / `DATABASE_URL` com o mesmo segredo.
3. Ajuste `VITE_API_URL` por ambiente (`https://api.condopartners.com.br` ou
   `https://api-dev.condopartners.com.br`) — só necessário no **build** da web.
4. Defina auth/CORS da API (obrigatório fora do localhost):
   - prod: `WEB_ORIGIN=https://app.condopartners.com.br`,
     `BETTER_AUTH_URL=https://api.condopartners.com.br`
   - dev: `WEB_ORIGIN=https://app-dev.condopartners.com.br`,
     `BETTER_AUTH_URL=https://api-dev.condopartners.com.br`
   - `BETTER_AUTH_SECRET` = string aleatória ≥32 chars (só Portainer / `deploy/.env`)
5. Defina `DEPLOY_ROOT` = path absoluto da pasta `deploy/` no host Docker
   (ex.: `/home/ubuntu/projetos/condopartners/deploy`).
6. `CERTBOT_EMAIL` para emissão Let's Encrypt (hooks abaixo).

`deploy/.env*` não entra no git (`.gitignore` cobre `.env`).

## Import no Portainer CE (image-based)

Pré-req: imagens buildadas no host (seção acima) e `DEPLOY_ROOT` correto.

### Prod

1. Stacks → **Add stack** → nome `condopartners-prod`.
2. Build method: **Web editor** (cole o conteúdo de
   `deploy/portainer/prod.portainer.yml`) **ou** Repository com compose path
   `deploy/portainer/prod.portainer.yml`.
3. Em **Environment variables**, cole env baseado em `.env.example` (valores
   reais), incluindo `DEPLOY_ROOT` e, se preciso, `API_IMAGE`/`WEB_IMAGE`/`LANDING_IMAGE`.
4. Deploy the stack.

> Se os containers **já** estão no ar via `docker compose` no host com o mesmo
> project name, importe com cuidado (mesmo nome de stack/projeto) e **não** faça
> `down` cego — o Portainer pode reconciliar; valide health antes de remover o
> projeto CLI.

### Dev

Igual, com `deploy/portainer/dev.portainer.yml`, nome `condopartners-dev`, e env
de dev (portas host padrão `8080`/`8443`).

Rede/volumes de dev usam sufixo `-dev` — isolados de prod.

### build-no-stack (só host / CI local)

`deploy/portainer/*.stack.yml` continua válido para `docker compose … build/up`
no checkout do monorepo. **Não** é o caminho preferido no Portainer CE Git.

## Ordem de subida / healthchecks

Compose já declara `depends_on`:

1. `postgres` — `pg_isready` (healthy)
2. `api` — `GET /health` via `bun` fetch
3. `web` / `landing` — `wget` na porta 80 (nginx interno)
4. `nginx` — edge (80/443)

Postgres **não** publica `ports` (só rede interna do stack).

## Volumes

| Volume (prod) | Uso |
|---------------|-----|
| `condopartners_pgdata` | dados Postgres |
| `condopartners_certs` | `/etc/letsencrypt` (certs) |
| `condopartners_certbot_www` | webroot ACME |

Dev: mesmos papéis com sufixo `_dev` / rede `condopartners-dev`.

## TLS (Let's Encrypt) — preparado, não emitido

nginx já tem:

- redirect `:80` → `:443`
- `ssl_certificate` / `ssl_certificate_key` sob `/etc/letsencrypt/live/<host>/`
- `location /.well-known/acme-challenge/` em `/var/www/certbot`

**Hooks (manual no host):**

1. Suba o stack (pode falhar o nginx até existirem arquivos de cert — gere
   self-signed temporários nos mesmos paths ou emita com certbot).
2. Com DNS ok, rode certbot em modo webroot montando os volumes
   `condopartners_certs` e `condopartners_certbot_www`, por exemplo:

```bash
docker run --rm \
  -v condopartners_certs:/etc/letsencrypt \
  -v condopartners_certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d condopartners.com.br -d www.condopartners.com.br \
  -d app.condopartners.com.br -d api.condopartners.com.br \
  --email "$CERTBOT_EMAIL" --agree-tos --non-interactive
```

3. Recarregue nginx: `docker exec <nginx> nginx -s reload`.

Renovação: cron/`certbot renew` + reload. Provisionamento DNS/host fica fora
deste repo (spec).

### Validar sintaxe nginx localmente

```bash
# certs dummy só para `nginx -t` (não commitados)
sudo mkdir -p /tmp/cp-certs/live/{condopartners.com.br,www.condopartners.com.br,app.condopartners.com.br,api.condopartners.com.br,app-dev.condopartners.com.br,api-dev.condopartners.com.br}
# www compartilha o cert do apex no path acima se quiser; paths usados nos
# server blocks ssl_certificate são os listados em conf.d/vhosts.conf

for d in condopartners.com.br app.condopartners.com.br api.condopartners.com.br \
         app-dev.condopartners.com.br api-dev.condopartners.com.br; do
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "/tmp/cp-certs/live/$d/privkey.pem" \
    -out "/tmp/cp-certs/live/$d/fullchain.pem" \
    -subj "/CN=$d" 2>/dev/null
done

docker run --rm \
  -v "$(pwd)/deploy/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$(pwd)/deploy/nginx/conf.d:/etc/nginx/conf.d:ro" \
  -v "$(pwd)/deploy/nginx/snippets:/etc/nginx/snippets:ro" \
  -v /tmp/cp-certs:/etc/letsencrypt:ro \
  nginx:1.27-alpine nginx -t
```

## Edge host (VPS) — `condopartners-edge`

O host termina TLS público e encaminha para o nginx da stack (prod `:9443`,
dev `:8443`). Config versionada em
`deploy/nginx/edge/condopartners-edge.conf`.

Hosts canônicos de **dev**: `app-dev.condopartners.com.br` /
`api-dev.condopartners.com.br` (não usar `*.dev.*` — Universal SSL não cobre).

**Apply / reload:**

```bash
sudo cp deploy/nginx/edge/condopartners-edge.conf \
  /etc/nginx/sites-available/condopartners-edge
sudo nginx -t && sudo systemctl reload nginx
```

Se a stack monta `deploy/nginx/conf.d` via bind, após atualizar `vhosts.conf`
(e criar symlinks `live/app-dev.*` → certs existentes se necessário):

```bash
docker exec condopartners-dev-nginx-1 nginx -t
docker exec condopartners-dev-nginx-1 nginx -s reload
# prod monta o mesmo conf.d — recarregar também:
docker exec condopartners-prod-nginx-1 nginx -t
docker exec condopartners-prod-nginx-1 nginx -s reload
```

Smoke:

```bash
curl -si https://api-dev.condopartners.com.br/health | head
curl -si https://app-dev.condopartners.com.br/ | head
```

## Nota da landing (GitHub Pages → container)

A landing pública hoje pode estar em **GitHub Pages**. Este stack passa a
servir `condopartners.com.br` (+ `www`) via container `landing` atrás do nginx.

Migração sugerida:

1. Merge do app `apps/landing` no branch de deploy.
2. Deploy do stack prod com imagem `landing`.
3. Alterar DNS A/AAAA (ou CNAME) de `condopartners.com.br` / `www` do Pages
   para o host Portainer.
4. Desligar o workflow Pages quando o DNS estiver estável (evitar dois origins).

Convívio temporário: Pages e container não podem responder no mesmo hostname;
use hostname de teste ou TTL baixo na cutover.

## Validação rápida (local)

```bash
bun test deploy
docker compose -f deploy/portainer/prod.stack.yml config >/dev/null
docker compose -f deploy/portainer/dev.stack.yml config >/dev/null
DEPLOY_ROOT="$(pwd)/deploy" docker compose -f deploy/portainer/prod.portainer.yml config >/dev/null
DEPLOY_ROOT="$(pwd)/deploy" docker compose -f deploy/portainer/dev.portainer.yml config >/dev/null
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com .
docker build -f apps/landing/Dockerfile .
```

## Runtime estático (web / landing)

Build com Bun (`vite build`); imagem final **nginx:alpine** serve os estáticos
(SPA `try_files`). API permanece em `oven/bun` com `bun run src/index.ts`.
