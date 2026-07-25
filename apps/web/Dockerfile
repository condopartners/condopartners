# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com .

FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/landing/package.json ./apps/landing/
COPY packages/shared/package.json ./packages/shared/

RUN bun install --frozen-lockfile

FROM oven/bun:1.3 AS build
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web ./apps/web

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN bun run --filter '@condopartners/web' build

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
