FROM node:lts-trixie-slim AS base
LABEL authors="ivopr"

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install dependencies based on the preferred package manager
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/prisma.config.ts ./apps/api/
COPY apps/api/prisma/schema.prisma ./apps/api/prisma/
RUN pnpm install --frozen-lockfile
RUN DB_USER=x DB_PASS=x DB_HOST=x DB_PORT=5432 DB_DATABASE=x pnpm --filter api exec prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

ENV PATH="${PATH}:/mold2"

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY --from=deps /app/node_modules ./node_modules
