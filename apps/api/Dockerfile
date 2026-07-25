# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/api/Dockerfile .

FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/landing/package.json ./apps/landing/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

FROM oven/bun:1.3 AS runtime
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

WORKDIR /app/apps/api

ENV API_HOST=0.0.0.0
ENV API_PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
