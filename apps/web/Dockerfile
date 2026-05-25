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

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm --filter web build 
RUN pnpm --filter web deploy --prod --legacy /prod/web

FROM node:lts-alpine AS runner
WORKDIR /app

RUN apk add --no-cache caddy
RUN addgroup -S appgroup
RUN adduser -S -u 1001 -G appgroup appuser
RUN mkdir -p /data /config /app/dist
RUN chown -R appuser:appgroup /data /config

COPY --from=builder --chown=appuser:appgroup /app/apps/web/dist ./dist
COPY --chown=appuser:appgroup apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --chown=appuser:appgroup --chmod=755 apps/web/entrypoint.sh /entrypoint.sh

USER appuser

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
