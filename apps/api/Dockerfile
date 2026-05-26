FROM node:lts-trixie-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install dependencies based on the preferred package manager
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/prisma.config.ts ./apps/api/
COPY apps/api/prisma/schema.prisma ./apps/api/prisma/
RUN pnpm install --frozen-lockfile
COPY apps/api/scripts ./apps/api/scripts/
RUN pnpm install --frozen-lockfile
RUN DB_USER=x DB_PASS=x DB_HOST=x DB_PORT=5432 DB_DATABASE=x \
    pnpm --filter api run generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api ./apps/api
COPY --from=deps /app/apps/api/src/generated ./apps/api/src/generated

RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PATH="${PATH}:/mold2"

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/

# Copy entrypoint script
COPY --chown=1001:1001 apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/apps/api

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser && \
    mkdir -p /files /mold2 && \
    chown 1001:1001 /files && \
    chmod 0775 /files && \
    chown -R 1001:1001 /mold2 && \
    chmod -R g+rx /mold2

ENTRYPOINT ["/entrypoint.sh"]

USER appuser

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
