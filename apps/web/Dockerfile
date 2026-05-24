FROM node:lts-alpine AS deps
WORKDIR /app

RUN apk add --no-cache git
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY apps/web ./apps/web

RUN pnpm --filter web build \
    && pnpm --filter web deploy --prod --legacy /prod/web

FROM node:lts-alpine AS runner
WORKDIR /app

RUN apk add --no-cache caddy \
    && addgroup -S appgroup \
    && adduser -S -u 1001 -G appgroup appuser \
    && mkdir -p /data /config /app/dist/client \
    && chown -R appuser:appgroup /data /config

COPY --from=builder --chown=appuser:appgroup /prod/web/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/apps/web/dist ./dist
COPY --chown=appuser:appgroup apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --chown=appuser:appgroup --chmod=755 apps/web/entrypoint.sh /entrypoint.sh
COPY --chown=appuser:appgroup apps/web/server ./server

USER appuser

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
