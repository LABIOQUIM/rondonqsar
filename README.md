# RondonQSAR

RondonQSAR is a full-stack QSAR platform for malaria and leishmaniasis screening. Users can register, sign in, upload SDF files, submit QSAR jobs, and review prediction results. Administrators can review all submissions, manage users, manage feature flags, bulk-import users from CSV, and send batch email.

The repository is a `pnpm` monorepo with:

- `apps/api` - NestJS API with Better Auth, Prisma, BullMQ, Swagger, feature flags, mailer, and QSAR processing
- `apps/web` - Vite React SPA with Mantine, TanStack Router, and TanStack Query

## Requirements

- Node.js 24.x or newer
- `pnpm` 10.x
- Docker and Docker Compose
- PostgreSQL
- Mold2 installed on the Docker host, executable by containers, and mounted into the API container

Redis is started by Docker Compose. PostgreSQL is expected to be reachable from the API using the values in the root `.env` file.

## Project Layout

- `apps/api` - backend API, auth, Prisma schema, queue consumers, seed script
- `apps/web` - frontend SPA, routes, admin tools, and static SEO assets
- `compose.yml` - local development stack
- `compose.local-prod.yml` - local production-like stack built from the current workspace
- `compose.prod.yml` - production deployment stack with Traefik

## What The App Does

- Public landing pages for the QSAR platform and project information
- Username/password authentication with Better Auth
- User QSAR submission flow for `.sdf` uploads
- User submission history and submission detail pages
- Admin submission review pages
- Admin user management
- Admin feature flag management
- Admin batch email tool
- Admin CSV user importer
- API system info endpoint

## Environment Configuration

Environment variables are loaded from the repository root `.env`. The compose files also read from that same file.

Main groups:

- Database: `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`
- Auth and public URLs: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL`, `WEB_PUBLIC_URL`
- Redis: `REDIS_HOST`, `REDIS_PORT`
- SMTP mail delivery: `SMTP_USER`, `SMTP_FROM`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_HOST`
- Seeded admin account: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_DISPLAY_USERNAME`, `SEED_ADMIN_ROLE`
- Optional runtime/build overrides: `PORT`, `SITE_URL`, `VITE_API_BASE_URL`, `VITE_API_PROXY_TARGET`

See `.env.example` for a documented template.

## Quick Start

1. Install dependencies:

```sh
pnpm install
```

2. Create your root `.env` from `.env.example` and adjust it for your machine.

3. Start the local development stack:

```sh
docker compose up -d --build
```

Development ports:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`

## Running Without Compose

Install dependencies at the repo root, make sure PostgreSQL and Redis are reachable, then run the apps with workspace commands.

API:

```sh
pnpm --filter api generate
pnpm --filter api start:dev
```

Web:

```sh
pnpm --filter web dev
```

## Prisma And Database Commands

Generate Prisma client:

```sh
pnpm --filter api generate
```

Create a development migration:

```sh
pnpm --filter api exec prisma migrate dev --name your_migration_name
```

Apply migrations:

```sh
pnpm --filter api exec prisma migrate deploy
```

Open Prisma Studio:

```sh
pnpm --filter api exec prisma studio
```

Seed feature flags and the optional admin account:

```sh
pnpm --filter api seed
```

## Production-Like Local Build

Use the local production compose file to build the production Dockerfiles from the current workspace:

```sh
docker compose -f compose.local-prod.yml up --build
```

Ports in this mode:

- Web: `http://localhost:3001`
- API: `http://localhost:4001`

This stack serves the web SPA through Caddy and proxies same-origin `/api` requests to the API.

## Production Deployment

The production deployment stack is defined in `compose.prod.yml` and uses Traefik in front of the web and API containers.

```sh
docker compose -f compose.prod.yml up --build -d
```

## Troubleshooting

- If the API cannot reach PostgreSQL from inside Docker, double-check `DB_HOST`. This repo currently uses an external database setup, and the current local config points at `172.17.0.1`.
- If Prisma-related code changes land, rerun `pnpm --filter api generate`.
- If auth cookies or redirects behave incorrectly, verify `APP_URL` and `BETTER_AUTH_URL` match the public web URL you are using.
- The API writes submission files under `/files`, which is mounted as a Docker volume. Missing volume mounts or missing Mold2 access will break QSAR processing.
- In production, set `MOLD2_HOST_PATH` if Mold2 is not at `/usr/local/bin/Mold2`. The host file must exist, have execute permissions such as `chmod 755 /usr/local/bin/Mold2`, and live on a filesystem that is not mounted with `noexec`.
- To smoke-test Mold2 in production, run `docker compose -f compose.prod.yml exec api sh -lc 'id; command -v Mold2; ls -l /mold2/Mold2; test -x /mold2/Mold2'`.
- If ports `3000`, `3001`, `4000`, or `4001` are already in use, stop the conflicting process or adjust the compose mappings.

## Verification

Useful checks:

```sh
pnpm lint
pnpm --filter api test
pnpm --filter web build
```
