FROM node:lts-trixie-slim AS base

ENV PATH="${PATH}:/mold2"

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/prisma.config.ts ./apps/api/
COPY apps/api/prisma/schema.prisma ./apps/api/prisma/
COPY apps/api/scripts ./apps/api/scripts/
RUN pnpm install --frozen-lockfile
RUN DB_USER=x DB_PASS=x DB_HOST=x DB_PORT=5432 DB_DATABASE=x \
    pnpm --filter api run generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api ./apps/api
COPY --from=deps /app/apps/api/src/generated ./apps/api/src/generated

RUN pnpm --filter api build

# Create a self-contained production deployment with only production dependencies
RUN pnpm --filter api deploy --prod --legacy /prod/api
# Copy dist/ separately since .gitignore excludes it from pnpm deploy
RUN cp -r /app/apps/api/dist /prod/api/dist

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the entire deployed package (production node_modules + dist)
COPY --chown=node:node --from=builder /prod/api .

# Copy entrypoint script
COPY --chown=node:node apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /files /mold2
RUN chown -R node:node /files
RUN chmod 0775 /files
RUN chown -R node:node /mold2
RUN chmod -R g+rx /mold2

ENTRYPOINT ["/entrypoint.sh"]

USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
