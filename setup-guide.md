# Full Local Production Setup Guide — RondonQSAR

Sets up **`compose.local-prod.yml`** — the real production Docker images (same Dockerfiles as `compose.prod.yml`), run locally without Traefik/TLS/domain routing.

## 1. Install prerequisites

| Tool | Why | Install |
|---|---|---|
| Docker Engine | Runs everything | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) ([Linux-specific steps](https://docs.docker.com/engine/install/)) |
| Docker Compose | `docker compose` CLI (bundled with modern Docker Engine/Desktop, verify with `docker compose version`) | [docs.docker.com/compose/install](https://docs.docker.com/compose/install/) |
| Mold2 | QSAR descriptor engine the API shells out to | [FDA — Access Mold2](https://www.fda.gov/science-research/mold2/access-mold2) (request/download the Mold2 executable + tutorial) |
| nfsvol Docker volume plugin | Both compose files declare `driver: nfsvol` on every volume — without this plugin, `docker compose up` fails to create them | [github.com/cirocosta/nfsvol](https://github.com/cirocosta/nfsvol) |
| pnpm 10.x | Runs Prisma CLI from the host for migrations/seed | `corepack enable` (ships with Node 24+) |

## 2. Install the nfsvol plugin

The plugin expects `/mnt/nfs` to exist on the host — it works fine locally without an actual NFS mount (data just won't distribute across hosts), so an empty directory is enough:

```sh
sudo mkdir -p /mnt/nfs
docker plugin install --grant-all-permissions --alias nfsvol cirocosta/nfsvol
```

Verify: `docker plugin ls` should show `nfsvol` as enabled.

## 3. Install Mold2 on the host

Download the Mold2 executable from the FDA link above, place it, and make it executable:

```sh
sudo mv Mold2 /usr/local/bin/Mold2
sudo chmod 755 /usr/local/bin/Mold2
```

Must be exactly `/usr/local/bin/Mold2` — `compose.local-prod.yml` hardcodes that host path in its bind mount, and the filesystem must not be mounted `noexec`.

## 4. Configure `.env`

```sh
cp .env.example .env
```

Edit:
- `DB_USER`, `DB_PASS`, `DB_DATABASE` → credentials for the Postgres container `compose.local-prod.yml` now runs for you (step 6 adds a `postgres` service using these same values)
- `DB_HOST` → `127.0.0.1`, `DB_PORT` → `5432` (the `postgres` container publishes 5432 to the host so `pnpm --filter api exec prisma ...` can reach it directly; the `api` container itself talks to it over the compose network as `postgres`, not via this value)
- `BETTER_AUTH_SECRET` → `openssl rand -base64 32`
- `BETTER_AUTH_URL`, `SITE_URL`, `WEB_PUBLIC_URL` → `http://localhost:3001`
- `VITE_API_BASE_URL` → leave `/api`
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` → set if you want an admin account seeded

## 5. Start Postgres and Redis

```sh
docker compose -f compose.local-prod.yml up -d postgres redis
```

Wait for it to report healthy: `docker compose -f compose.local-prod.yml ps postgres`.

## 6. Run migrations and seed

The API image does **not** auto-migrate on boot (`entrypoint.sh` only starts `node dist/src/main.js`) — do it from the host, against the Postgres container you just started:

```sh
pnpm install
pnpm --filter api generate
pnpm --filter api exec prisma migrate deploy
pnpm --filter api seed
```

`seed` creates the feature flags, the optional admin account, and the anonymous account (username/password `anonymous`/`anonymous`, see `apps/api/prisma/seed.ts`).

## 7. Build and start the app

```sh
docker compose -f compose.local-prod.yml up --build -d
```

(`postgres` and `redis` are already running — this brings up `api` and `web`, which wait on Postgres's healthcheck before starting.)

## 8. Verify

- Web: `http://localhost:3001`, API: `http://localhost:4001`
- `docker compose -f compose.local-prod.yml logs -f api` — no `/files` or Mold2 errors
- `docker compose -f compose.local-prod.yml exec api sh -lc 'command -v Mold2; test -x /mold2/Mold2 && echo OK'`

## Troubleshooting

- **`docker compose up` fails creating volumes** → nfsvol plugin not installed/enabled (step 2).
- **API exits immediately** → check logs; `entrypoint.sh` fails fast with a specific message for missing `/files` perms or missing/non-executable Mold2.
- **`/files` not writable** → volume needs to be writable by UID:GID `1001:1001`.
- **`prisma migrate deploy` from the host can't reach Postgres** → confirm `DB_HOST=127.0.0.1`/`DB_PORT=5432` in `.env` and that the `postgres` container is up (step 5).
- **Auth cookies/redirects broken** → `BETTER_AUTH_URL`/`APP_URL` must match the URL you're browsing (`:3001`, not `:4001`).
- **Port conflict on 3001/4001/5432** → stop the conflicting process or edit `ports:` in `compose.local-prod.yml`.
