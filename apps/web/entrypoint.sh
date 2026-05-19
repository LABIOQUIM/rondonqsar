#!/bin/sh
set -e

node /app/server/index.mjs &
node_pid=$!

cleanup() {
  kill "$node_pid"
  wait "$node_pid" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
