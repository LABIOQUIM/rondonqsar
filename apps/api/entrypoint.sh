#!/bin/sh
set -e

EXPECTED_UID=1001
EXPECTED_GID=1001
MOLD2_PATH="/mold2/Mold2"
PROBE_PATH="/files/.write-test.$$"

if [ ! -d /files ]; then
  echo "Error: /files does not exist. The container expects /files to be present and writable by UID:GID ${EXPECTED_UID}:${EXPECTED_GID}." >&2
  exit 1
fi

if ! touch "$PROBE_PATH" 2>/dev/null; then
  echo "Error: /files is not writable by UID:GID $(id -u):$(id -g). Configure the mounted volume so UID:GID ${EXPECTED_UID}:${EXPECTED_GID} can write to /files." >&2
  exit 1
fi

rm -f "$PROBE_PATH"

if ! command -v Mold2 >/dev/null 2>&1; then
  echo "Error: Mold2 is not available on PATH. Mount the host executable." >&2
  exit 1
fi

if [ ! -f "$MOLD2_PATH" ]; then
  echo "Error: ${MOLD2_PATH} does not exist. Configure the API container volume ${MOLD2_PATH} to point at the host Mold2 executable." >&2
  exit 1
fi

if [ ! -x "$MOLD2_PATH" ]; then
  echo "Error: ${MOLD2_PATH} is not executable by UID:GID $(id -u):$(id -g). Run chmod 755 on the host Mold2 file and ensure the host filesystem is not mounted noexec." >&2
  exit 1
fi

exec "$@"
