# syntax=docker/dockerfile:1
# Build from monorepo root: docker build -f apps/landing/Dockerfile .
# Requires apps/landing sources (workspace @condopartners/landing).

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
COPY apps/landing ./apps/landing

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/landing/node_modules ./apps/landing/node_modules

ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

RUN bun run --filter '@condopartners/landing' build

FROM nginx:1.27-alpine AS runtime
COPY apps/landing/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/landing/dist /usr/share/nginx/html
EXPOSE 80
